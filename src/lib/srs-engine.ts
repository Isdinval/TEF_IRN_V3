import { createClient } from './supabase-server';

/**
 * Algorithme SM-2 simplifié pour la répétition espacée.
 */
export async function updateSRS(userId: string, exerciseId: string, score: number) {
  const supabase = await createClient();
  const isCorrect = score >= 80;

  const { data: existing } = await supabase
    .from('user_reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .single();

  let interval = 1;
  let ease = existing?.ease_factor || 2.5;
  let correctCount = existing?.consecutive_correct || 0;

  if (isCorrect) {
    correctCount++;
    if (correctCount === 1) interval = 1;
    else if (correctCount === 2) interval = 6;
    else interval = Math.round((existing?.interval_days || 1) * ease);
  } else {
    correctCount = 0;
    interval = 1;
    ease = Math.max(1.3, ease - 0.2);
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  if (existing) {
    await supabase.from('user_reviews').update({
      next_review_at: nextReview.toISOString(),
      interval_days: interval,
      ease_factor: ease,
      consecutive_correct: correctCount
    }).eq('id', existing.id);
  } else {
    await supabase.from('user_reviews').insert({
      user_id: userId,
      exercise_id: exerciseId,
      next_review_at: nextReview.toISOString(),
      interval_days: interval,
      ease_factor: ease,
      consecutive_correct: correctCount
    });
  }
}
