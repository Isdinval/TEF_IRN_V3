import { createClient as createBrowserClient } from './supabase';

/**
 * Algorithme SM-2 simplifié pour la répétition espacée (SRS) — Examen civique.
 * Utilisé côté client (examen-civique/page.tsx). Miroir exact de srs-engine.ts,
 * mais sur user_civic_reviews / question_id au lieu de user_vocabulary_reviews / vocab_id.
 */
export async function updateCivicSRS(userId: string, questionId: string, isCorrect: boolean) {
  const supabase = createBrowserClient();

  const { data: existing } = await supabase
    .from('user_civic_reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();

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
    question_id: questionId,
    next_review_at: nextReview.toISOString(),
    interval_days: interval,
    ease_factor: ease,
    consecutive_correct: correctCount,
    updated_at: new Date().toISOString()
  };

  if (existing) {
    await supabase.from('user_civic_reviews').update(payload).eq('id', existing.id);
  } else {
    await supabase.from('user_civic_reviews').insert(payload);
  }
}
