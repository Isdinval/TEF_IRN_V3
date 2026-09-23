import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { analyzeUserErrorsAndRecommend, trackUserError, resolveUserError, completeRecommendationIfResolved } from '@/lib/recommendation-engine';
import { updateSRS } from '@/lib/srs-engine-server';
import { captureServerEvent } from '@/lib/posthog-server';
import { awardXpAndStreak } from '@/lib/xp-streak';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { exerciseId, score, answers, aiFeedback, studyTimeMinutes } = await req.json();

    // 1. Enregistrer la tentative
    const { data: attempt, error: attemptError } = await supabase
      .from('exercise_attempts')
      .insert({
        user_id: user.id,
        exercise_id: exerciseId,
        score,
        answers,
        is_completed: true,
        study_time_minutes: studyTimeMinutes || 0
      })
      .select('id')
      .single();

    if (attemptError) throw attemptError;

    // 1b. Enregistrer le feedback IA détaillé (écrit), si fourni
    if (aiFeedback && attempt?.id) {
      const { error: feedbackError } = await supabase
        .from('ai_feedback')
        .insert({
          attempt_id: attempt.id,
          overall_score: aiFeedback.score_global,
          global_comment: aiFeedback.conseil_general,
          detailed_annotations: aiFeedback.liste_des_erreurs,
          improved_version: aiFeedback.texte_corrige_complet
        });

      if (feedbackError) console.error("AI feedback insert error:", feedbackError);
    }

    // 2. Mettre à jour les XP, le streak et la dernière activité du profil
    const xpGain = Math.round(score);
    await awardXpAndStreak(supabase, user.id, xpGain);

    // Type d'exercice (qcm, trous, qcm_centre_entrainement…) remonté dans
    // l'événement PostHog exercise_completed, pour comparer l'usage par module.
    let exerciseType: string | null = null;

    // 3. Tracker ou résoudre l'erreur selon le résultat (prérequis du moteur
    // de recommandation), puis vérifier si une recommandation en cours peut
    // être clôturée (leçon terminée + point faible résolu).
    if (exerciseId) {
      try {
        const { data: exerciseData } = await supabase
          .from('exercises')
          .select('category, tags, lesson_id, level, type')
          .eq('id', exerciseId)
          .single();

        exerciseType = exerciseData?.type ?? null;

        if (exerciseData?.category) {
          const subCategory = exerciseData.tags?.find((t: string) => t !== exerciseData.category) ?? null;

          if (score < 50) {
            await trackUserError(user.id, exerciseData.category, subCategory, 'Exercice ciblé', exerciseData.level);
          } else {
            await resolveUserError(user.id, exerciseData.category, subCategory);
            await completeRecommendationIfResolved(user.id, exerciseData.category, subCategory);
          }
        }
      } catch (errorTrackingError) {
        console.error("Error tracking failed:", errorTrackingError);
      }
    }

    // 4. Déclencher le moteur de recommandation
    try {
      await analyzeUserErrorsAndRecommend(user.id);
    } catch (recoError) {
      console.error("Recommendation engine error:", recoError);
    }

    // 5. Mettre à jour l'algorithme de répétition espacée (SRS)
    if (exerciseId) {
      try {
        await updateSRS(user.id, exerciseId, score);
      } catch (srsError) {
        console.error("SRS update error:", srsError);
      }
    }

    await captureServerEvent(user.id, "exercise_completed", {
      score: xpGain,
      study_time_minutes: studyTimeMinutes || 0,
      has_ai_feedback: Boolean(aiFeedback),
      exercise_type: exerciseType,
    });

    return NextResponse.json({ success: true, xpGained: xpGain });
  } catch (error: any) {
    console.error("Exercise complete API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
