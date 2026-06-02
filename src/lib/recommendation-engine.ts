import { createClient } from './supabase-server';

export async function generateRecommendation(userId: string) {
  const supabase = await createClient();

  // 1. Récupérer les 5 derniers échecs (score < 50)
  const { data: failures } = await supabase
    .from('exercise_attempts')
    .select('*, exercises(category, level)')
    .eq('user_id', userId)
    .lt('score', 50)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!failures || failures.length === 0) {
    return null;
  }

  // 2. Identifier la catégorie la plus problématique
  const categories = failures.map(f => (f.exercises as any).category);
  const mostFrequentCategory = categories.reduce((a, b, i, arr) =>
    arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
  );

  // 3. Vérifier s'il y a déjà une recommandation en attente pour cette catégorie
  const { data: existingReco } = await supabase
    .from('recommendations')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .limit(1);

  if (existingReco && existingReco.length > 0) {
    return null; // On n'ajoute pas de doublon
  }

  // 4. Trouver une leçon ou exercice de cette catégorie non encore réussi
  const { data: suggestion } = await supabase
    .from('lessons')
    .select('id, title')
    .eq('category', mostFrequentCategory)
    .limit(1)
    .single();

  if (suggestion) {
    // 5. Créer la recommandation
    await supabase.from('recommendations').insert({
      user_id: userId,
      type: 'lesson',
      reference_id: suggestion.id,
      reason: `Tu as eu des difficultés récemment en ${mostFrequentCategory}. Cette leçon va t'aider à progresser.`,
      status: 'pending'
    });
  }
}
