import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { checkComprehensionQuota, comprehensionQuotaMessage } from '@/lib/comprehension-quota';

// Route de correction pour la pratique CE/CO dissociée de l'Examen Blanc
// (item 4 du plan "pratique CE/CO"). Miroir simplifié de
// /api/exam/ce-co-complete/route.ts : même principe de sécurité (le client
// ne lit jamais correct_answer/explanation -- ce_scenario_questions_public/
// co_scenario_questions_public les excluent -- la correction est faite ici,
// via le client admin, jamais confiée au client).
//
// Simplifications volontaires par rapport à la route Examen Blanc, pour
// rester au périmètre demandé :
// - Pas d'intégration à user_errors / au moteur de recommandation (ces
//   tables n'ont pas de colonne category/tags) -- pourra être ajouté plus
//   tard si le besoin est confirmé, pas anticipé ici.
// - Pas de fenêtre d'idempotence (30s) : une session de pratique porte sur
//   un seul scenario à la fois, le risque de double-soumission concurrente
//   est bien plus faible que sur un examen complet multi-sections.

interface ScenarioResultInput {
  questionId: string;
  userAnswer: string;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { skill, results } = await req.json();

    if (skill !== 'CE' && skill !== 'CO') {
      return NextResponse.json({ error: 'skill invalide' }, { status: 400 });
    }

    const typedResults = results as ScenarioResultInput[] | undefined;
    if (!typedResults || typedResults.length === 0) {
      return NextResponse.json({ error: 'results manquant ou vide' }, { status: 400 });
    }

    const questionsTable = skill === 'CE' ? 'ce_scenario_questions' : 'co_scenario_questions';
    const attemptsTable = skill === 'CE' ? 'ce_scenario_attempts' : 'co_scenario_attempts';
    const questionIds = typedResults.map((r) => r.questionId);

    // Correction faite ici, jamais confiée au client -- même principe que
    // /api/exam/ce-co-complete (audit sécurité item 1).
    const admin = createAdminClient();
    const { data: questions, error: questionsError } = await admin
      .from(questionsTable)
      .select('id, scenario_id, correct_answer, explanation')
      .in('id', questionIds);

    if (questionsError) throw questionsError;

    const questionById = new Map((questions || []).map((q) => [q.id, q]));

    // Quota freemium (1 sujet distinct/jour/épreuve pour Gratuit) : contrôle
    // serveur avant toute correction, source de vérité (le check à l'ouverture
    // du sujet n'est que de l'UX). Un envoi mêlant des questions de plusieurs
    // sujets est compté sujet par sujet.
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .maybeSingle();
    const scenarioIds = [...new Set((questions || []).map((q) => q.scenario_id as string))];
    const quota = await checkComprehensionQuota(supabase, user.id, skill, profile?.subscription_tier, scenarioIds);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: comprehensionQuotaMessage(skill, quota.limit ?? 0), limit: quota.limit },
        { status: 429 }
      );
    }

    const gradedResults = typedResults.map((r) => {
      const question = questionById.get(r.questionId);
      const correctAnswer = question?.correct_answer ?? '';
      // Bug critique signalé par Olivier (toute réponse marquée fausse même
      // quand elle est correcte) : `options` est stocké comme des chaînes
      // complètes ("A) a décidé"), mais `correct_answer` en base ne contient
      // que la lettre ("A") -- comparer les deux tels quels ne matche jamais.
      // On extrait la lettre en tête de la réponse envoyée par le client
      // avant de comparer.
      const userLetter = (r.userAnswer || '').trim().charAt(0).toUpperCase();
      return {
        questionId: r.questionId,
        userAnswer: r.userAnswer,
        isCorrect: !!question && userLetter === correctAnswer,
        correctAnswer,
        explanation: question?.explanation ?? undefined,
      };
    });
    const gradedById = new Map(gradedResults.map((g) => [g.questionId, g]));

    const { error: attemptsError } = await supabase.from(attemptsTable).insert(
      typedResults.map((r) => ({
        user_id: user.id,
        scenario_question_id: r.questionId,
        selected_answer: r.userAnswer || null,
        is_correct: gradedById.get(r.questionId)?.isCorrect ?? false,
      }))
    );

    if (attemptsError) throw attemptsError;

    return NextResponse.json({ success: true, results: gradedResults });
  } catch (error: any) {
    console.error('Comprehension complete API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
