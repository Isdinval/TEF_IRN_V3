import { createClient as createServerClient } from './supabase-server';

interface UserReviewRow {
  id: string;
  user_id: string;
  exercise_id: string;
  next_review_at: string;
  interval_days: number;
  ease_factor: number;
  consecutive_correct: number;
  created_at: string;
  updated_at: string;
}

/**
 * Algorithme SM-2 simplifié pour la répétition espacée (SRS) — Exercices généraux.
 * Utilisé côté serveur uniquement (api/exercise-complete/route.ts), pour avoir accès
 * à la session utilisateur (cookies) et respecter la RLS sur user_reviews.
 */
export async function updateSRS(userId: string, exerciseId: string, score: number) {
  const supabase = await createServerClient();
  const isCorrect = score >= 80;

  const { data } = await supabase
    .from('user_reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('exercise_id', exerciseId)
    .maybeSingle();
  const existing = data as UserReviewRow | null;

  let interval = 1;
  let ease = existing?.ease_factor || 2.5;
  let correctCount = existing?.consecutive_correct || 0;

  if (isCorrect) {
    correctCount++;
    if (correctCount === 1) interval = 1;
    else if (correctCount === 2) interval = 6;
    else interval = Math.round((existing?.interval_days || 1) * ease);
    ease = Math.min(3.0, ease + 0.1);
  } else {
    correctCount = 0;
    interval = 1;
    ease = Math.max(1.3, ease - 0.2);
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  const payload = {
    user_id: userId,
    exercise_id: exerciseId,
    next_review_at: nextReview.toISOString(),
    interval_days: interval,
    ease_factor: ease,
    consecutive_correct: correctCount,
    updated_at: new Date().toISOString()
  };

  if (existing) {
    await supabase.from('user_reviews').update(payload).eq('id', existing.id);
  } else {
    await supabase.from('user_reviews').insert(payload);
  }
}
