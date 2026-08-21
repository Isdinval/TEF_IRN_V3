import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { trackUserError, resolveUserError, completeRecommendationIfResolved, analyzeUserErrorsAndRecommend } from '@/lib/recommendation-engine';

// Route dédiée à la persistance des sections CE/CO d'examen blanc (table
// exam_ce_co_attempts, item 4 du plan). Appelée une fois par section terminée
// depuis ExamContext.tsx::finishSection(), avec le détail de toutes les
// réponses de la section en un seul appel (pas une requête par question).
//
// Contrairement à l'Écrit (voir writing/scenario-complete/route.ts) : CE/CO
// sont des QCM fermés à réponse unique. Une réponse correcte prouve donc la
// maîtrise du point testé -- on appelle resolveUserError sur succès, pas
// seulement trackUserError sur échec (même principe que /api/exercise-complete
// pour les exercices qcm/trous ciblés).

interface CeCoResultInput {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { section, results } = await req.json();

    if (section !== 'CE' && section !== 'CO') {
      return NextResponse.json({ error: 'section invalide' }, { status: 400 });
    }

    const typedResults = results as CeCoResultInput[] | undefined;
    if (!typedResults || typedResults.length === 0) {
      return NextResponse.json({ error: 'results manquant ou vide' }, { status: 400 });
    }

    // 1. Récupérer category/tags des questions concernées (posés par la
    // migration item 3), pour savoir quel point faible tracker par question,
    // ainsi que exam_id pour en dériver le niveau CECRL (item level fix,
    // test P0) -- ni exam_questions ni exam_ce_co_attempts n'ont leur propre
    // colonne level, seul l'examen parent en a une.
    const questionIds = typedResults.map(r => r.questionId);
    const { data: questions, error: questionsError } = await supabase
      .from('exam_questions')
      .select('id, category, tags, exam_id')
      .in('id', questionIds);

    if (questionsError) throw questionsError;

    const questionById = new Map((questions || []).map(q => [q.id, q]));

    // Niveau de l'examen (dérivé côté serveur, jamais fait confiance à une
    // valeur envoyée par le client) -- une soumission CE/CO porte toujours
    // sur un seul examen, donc un seul exam_id parmi les questions reçues.
    let examLevel: string | null = null;
    const examId = questions?.[0]?.exam_id;
    if (examId) {
      const { data: examRow } = await supabase
        .from('exams')
        .select('level')
        .eq('id', examId)
        .maybeSingle();
      examLevel = examRow?.level ?? null;
    }

    // 1bis. Idempotence côté serveur (item 5 du plan bug_affichage_repete_examen) :
    // en complément des protections client (items 1-3), on ignore ici toute
    // question déjà enregistrée pour ce user/section il y a moins de 30
    // secondes -- fenêtre largement suffisante pour couvrir un double-clic ou
    // une resoumission concurrente, sans risquer de bloquer une reprise
    // légitime de l'examen (nouvelle tentative, autre jour).
    const { data: recentAttempts } = await supabase
      .from('exam_ce_co_attempts')
      .select('exam_question_id')
      .eq('user_id', user.id)
      .eq('section', section)
      .in('exam_question_id', questionIds)
      .gte('created_at', new Date(Date.now() - 30_000).toISOString());

    const alreadyRecordedIds = new Set((recentAttempts || []).map(a => a.exam_question_id));
    const newResults = typedResults.filter(r => !alreadyRecordedIds.has(r.questionId));

    if (newResults.length === 0) {
      // Soumission entièrement dupliquée : rien de neuf à persister, et on
      // évite de rappeler trackUserError/resolveUserError/analyzeUserErrorsAndRecommend
      // en double pour les mêmes catégories.
      return NextResponse.json({ success: true, skipped: 'duplicate_submission' });
    }

    // 2. Enregistrer la tentative de chaque question (table dédiée, 1 ligne
    // par question répondue -- voir item 4).
    const { error: attemptsError } = await supabase
      .from('exam_ce_co_attempts')
      .insert(
        newResults.map(r => ({
          user_id: user.id,
          exam_question_id: r.questionId,
          section,
          selected_answer: r.userAnswer || null,
          is_correct: r.isCorrect,
        }))
      );

    if (attemptsError) throw attemptsError;

    // 3. Remonter les erreurs vers user_errors, résoudre sur succès. Comme
    // pour l'Écrit (item 10.12), on dédoublonne par paire (category,
    // sub_category) pour ne pas gonfler frequency artificiellement quand
    // plusieurs questions ratées de la section pointent vers le même point.
    try {
      const failed = new Map<string, { category: string; subCategory: string | null }>();
      const succeeded = new Map<string, { category: string; subCategory: string | null }>();

      for (const r of newResults) {
        const question = questionById.get(r.questionId);
        if (!question?.category) continue; // défensif : question non encore taguée

        const subCategory = question.tags?.[0] ?? null;
        const key = `${question.category}|${subCategory ?? ''}`;
        (r.isCorrect ? succeeded : failed).set(key, { category: question.category, subCategory });
      }

      for (const { category, subCategory } of failed.values()) {
        await trackUserError(user.id, category, subCategory, 'Examen blanc', examLevel);
      }
      for (const { category, subCategory } of succeeded.values()) {
        await resolveUserError(user.id, category, subCategory);
        // Item 17 : jamais appelée ici jusque-là -- une question CE/CO
        // réussie pouvait résoudre le point faible sans jamais clôturer la
        // recommandation de leçon associée.
        await completeRecommendationIfResolved(user.id, category, subCategory);
      }
    } catch (errorTrackingError) {
      console.error('Error tracking failed (CE/CO exam):', errorTrackingError);
    }

    // 4. Déclencher le moteur de recommandation avec ces nouveaux points faibles
    try {
      await analyzeUserErrorsAndRecommend(user.id);
    } catch (recoError) {
      console.error('Recommendation engine error (CE/CO exam):', recoError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('CE/CO exam complete API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
