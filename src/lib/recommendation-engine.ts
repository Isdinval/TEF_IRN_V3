import { createClient } from './supabase-server';

/**
 * Analyse les erreurs récentes de l'utilisateur pour générer des recommandations intelligentes.
 */
export async function analyzeUserErrorsAndRecommend(userId: string) {
  const supabase = await createClient();

  // 1. Récupérer les erreurs les plus fréquentes de l'utilisateur
  const { data: errors } = await supabase
    .from('user_errors')
    .select('*')
    .eq('user_id', userId)
    .order('frequency', { ascending: false })
    .limit(3);

  if (!errors || errors.length === 0) {
    // Fallback : suggérer un type d'exercice général
    await createGenericRecommendation(userId);
    return;
  }

  const topError = errors[0];

  // 2. Chercher une leçon qui correspond à la catégorie de l'erreur
  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title, category')
    .eq('category', topError.category.toLowerCase())
    .limit(1)
    .single();

  if (lesson) {
    // 3. Créer la recommandation de leçon
    await supabase.from('recommendations').upsert({
      user_id: userId,
      type: 'lesson',
      reference_id: lesson.id,
      reason: `Nous avons remarqué des difficultés récurrentes en ${topError.category}. Cette leçon sur "${lesson.title}" vous aidera à progresser.`,
      status: 'pending'
    }, { onConflict: 'user_id, reference_id' });
  } else {
    // 4. Si pas de leçon spécifique, suggérer de l'entraînement dans cette catégorie
    await supabase.from('recommendations').insert({
      user_id: userId,
      type: 'exercise',
      reason: `Besoin d'entraînement en ${topError.category} ? Faire 10 exercices de type QCM pour renforcer vos bases.`,
      status: 'pending'
    });
  }
}

async function createGenericRecommendation(userId: string) {
  const supabase = await createClient();
  const options = [
    { type: 'exercise', reason: "Travailler la compréhension orale avec des QCM de niveau B2." },
    { type: 'review', reason: "C'est le moment idéal pour réviser vos acquis avec l'algorithme SRS." },
    { type: 'exercise', reason: "Pratiquez l'expression écrite pour améliorer votre score global." }
  ];

  const randomOption = options[Math.floor(Math.random() * options.length)];

  await supabase.from('recommendations').insert({
    user_id: userId,
    type: randomOption.type,
    reason: randomOption.reason,
    status: 'pending'
  });
}

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
  const categories = failures.map(f => (f.exercises as any)?.category).filter(Boolean);
  if (categories.length === 0) return null;

  const mostFrequentCategory = categories.reduce((a, b, i, arr) =>
    arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
  );

  // 3. Vérifier s'il y a déjà une recommandation en attente pour cette catégorie
  const { data: existingReco } = await supabase
    .from('recommendations')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .limit(3);

  if (existingReco && existingReco.length >= 3) {
    return null;
  }

  // 4. Trouver une leçon de cette catégorie
  const { data: suggestion } = await supabase
    .from('lessons')
    .select('id, title')
    .eq('category', mostFrequentCategory.toLowerCase())
    .limit(1)
    .single();

  if (suggestion) {
    await supabase.from('recommendations').insert({
      user_id: userId,
      type: 'lesson',
      reference_id: suggestion.id,
      reason: `Tu as eu des difficultés récemment en ${mostFrequentCategory}. Cette leçon va t'aider à progresser.`,
      status: 'pending'
    });
  }
}
