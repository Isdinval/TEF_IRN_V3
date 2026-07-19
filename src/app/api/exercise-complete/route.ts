import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { analyzeUserErrorsAndRecommend, trackUserError } from '@/lib/recommendation-engine';
import { updateSRS } from '@/lib/srs-engine-server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { exerciseId, score, answers, aiFeedback } = await req.json();

    // 1. Enregistrer la tentative
    const { data: attempt, error: attemptError } = await supabase
      .from('exercise_attempts')
      .insert({
        user_id: user.id,
        exercise_id: exerciseId,
        score,
        answers,
        is_completed: true
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

    // 2. Mettre à jour les XP du profil
    const xpGain = Math.round(score);
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_xp')
      .eq('id', user.id)
      .single();

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ total_xp: (profile?.total_xp || 0) + xpGain })
      .eq('id', user.id);

    if (profileError) console.error("Profile update error:", profileError);

    // 3. Tracker l'erreur si l'exercice est raté (prérequis du moteur de recommandation)
    if (exerciseId && score < 50) {
      try {
        const { data: exerciseData } = await supabase
          .from('exercises')
          .select('category, tags')
          .eq('id', exerciseId)
          .single();

        if (exerciseData?.category) {
          const subCategory = exerciseData.tags?.find((t: string) => t !== exerciseData.category) ?? null;
          await trackUserError(user.id, exerciseData.category, subCategory);
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

    return NextResponse.json({ success: true, xpGained: xpGain });
  } catch (error: any) {
    console.error("Exercise complete API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
