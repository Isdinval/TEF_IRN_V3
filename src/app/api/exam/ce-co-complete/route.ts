import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { trackUserError, resolveUserError, analyzeUserErrorsAndRecommend } from '@/lib/recommendation-engine';

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
    // migration item 3), pour savoir quel point faible tracker par question.
    const questionIds = typedResults.map(r => r.questionId);
    const { data: questions, error: questionsError } = await supabase
      .from('exam_questions')
      .select('id, category, tags')
      .in('id', questionIds);

    if (questionsError) throw questionsError;

    const questionById = new Map((questions || []).map(q => [q.id, q]));

    // 2. Enregistrer la tentative de chaque question (table dédiée, 1 ligne
    // par question répondue -- voir item 4).
    const { error: attemptsError } = await supabase
      .from('exam_ce_co_attempts')
      .insert(
        typedResults.map(r => ({
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

      for (const r of typedResults) {
        const question = questionById.get(r.questionId);
        if (!question?.category) continue; // défensif : question non encore taguée

        const subCategory = question.tags?.[0] ?? null;
        const key = `${question.category}|${subCategory ?? ''}`;
        (r.isCorrect ? succeeded : failed).set(key, { category: question.category, subCategory });
      }

      for (const { category, subCategory } of failed.values()) {
        await trackUserError(user.id, category, subCategory, 'Examen blanc');
      }
      for (const { category, subCategory } of succeeded.values()) {
        await resolveUserError(user.id, category, subCategory);
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
