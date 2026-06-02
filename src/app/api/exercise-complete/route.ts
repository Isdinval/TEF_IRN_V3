import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { generateRecommendation } from '@/lib/recommendation-engine';
import { updateSRS } from '@/lib/srs-engine';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { exerciseId, score, answers } = await req.json();

    // 1. Enregistrer la tentative
    const { error: attemptError } = await supabase
      .from('exercise_attempts')
      .insert({
        user_id: user.id,
        exercise_id: exerciseId,
        score,
        answers,
        is_completed: true
      });

    if (attemptError) throw attemptError;

    // 2. Mettre à jour les XP du profil
    const xpGain = Math.round(score);
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_xp')
      .eq('id', user.id)
      .single();

    await supabase
      .from('profiles')
      .update({ total_xp: (profile?.total_xp || 0) + xpGain })
      .eq('id', user.id);

    // 3. Déclencher le moteur de recommandation
    await generateRecommendation(user.id);
    // Analyse approfondie des erreurs
    const { analyzeUserErrorsAndRecommend } = await import('@/lib/recommendation-engine');
    await analyzeUserErrorsAndRecommend(user.id);

    // 4. Mettre à jour l'algorithme de répétition espacée (SRS)
    if (exerciseId) {
      await updateSRS(user.id, exerciseId, score);
    }

    return NextResponse.json({ success: true, xpGained: xpGain });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
