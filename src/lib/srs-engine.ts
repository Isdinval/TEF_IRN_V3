import { createClient as createBrowserClient } from './supabase';

/**
 * Algorithme SM-2 simplifié pour la répétition espacée (SRS) — Vocabulaire.
 * Utilisé côté client (vocab/page.tsx).
 */
export async function updateVocabularySRS(userId: string, vocabId: string, isCorrect: boolean) {
  const supabase = createBrowserClient();

  const { data: existing } = await supabase
    .from('user_vocabulary_reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('vocab_id', vocabId)
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
    vocab_id: vocabId,
    next_review_at: nextReview.toISOString(),
    interval_days: interval,
    ease_factor: ease,
    consecutive_correct: correctCount,
    updated_at: new Date().toISOString()
  };

  if (existing) {
    await supabase.from('user_vocabulary_reviews').update(payload).eq('id', existing.id);
  } else {
    await supabase.from('user_vocabulary_reviews').insert(payload);
  }
}
