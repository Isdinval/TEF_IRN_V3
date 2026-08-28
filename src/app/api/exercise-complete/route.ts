import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { analyzeUserErrorsAndRecommend, trackUserError, resolveUserError, completeRecommendationIfResolved } from '@/lib/recommendation-engine';
import { updateSRS } from '@/lib/srs-engine-server';
import { captureServerEvent } from '@/lib/posthog-server';

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
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_xp, streak_count, last_activity_at')
      .eq('id', user.id)
      .single();

    const now = new Date();
    const daysSinceLastActivity = profile?.last_activity_at
      ? Math.round(
          (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
            Date.UTC(
              new Date(profile.last_activity_at).getUTCFullYear(),
              new Date(profile.last_activity_at).getUTCMonth(),
              new Date(profile.last_activity_at).getUTCDate()
            )) /
            86400000
        )
      : null;

    // null (jamais actif) ou >1 jour d'écart -> on repart à 1. Même jour -> inchangé. 1 jour -> +1.
    const newStreak =
      daysSinceLastActivity === 0
        ? profile?.streak_count || 1
        : daysSinceLastActivity === 1
          ? (profile?.streak_count || 0) + 1
          : 1;

    // Audit sécurité item 4 (2026-08) : total_xp/streak_count sont protégées
    // par un trigger qui bloque toute écriture non-service_role (voir
    // 20260828000002_profiles_guard_privileged_columns.sql) -- avec le client
    // authentifié normal, cette mise à jour légitime serait désormais
    // silencieusement ignorée elle aussi. On passe donc sur le client admin
    // pour cette écriture précise, comme le font déjà les routes
    // toggle-admin/toggle-test ; le reste de la route (lecture du profil,
    // exercise_attempts, etc.) reste sur le client utilisateur normal.
    const { error: profileError } = await createAdminClient()
      .from('profiles')
      .update({
        total_xp: (profile?.total_xp || 0) + xpGain,
        streak_count: newStreak,
        last_activity_at: now.toISOString()
      })
      .eq('id', user.id);

    if (profileError) console.error("Profile update error:", profileError);

    // 3. Tracker ou résoudre l'erreur selon le résultat (prérequis du moteur
    // de recommandation), puis vérifier si une recommandation en cours peut
    // être clôturée (leçon terminée + point faible résolu).
    if (exerciseId) {
      try {
        const { data: exerciseData } = await supabase
          .from('exercises')
          .select('category, tags, lesson_id, level')
          .eq('id', exerciseId)
          .single();

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
    });

    return NextResponse.json({ success: true, xpGained: xpGain });
  } catch (error: any) {
    console.error("Exercise complete API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
