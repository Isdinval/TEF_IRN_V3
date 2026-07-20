import { createClient } from './supabase-server';

/**
 * Incrémente (ou crée) le compteur d'erreurs de l'utilisateur pour une catégorie donnée.
 * Alimente user_errors, qui est la source de données de analyzeUserErrorsAndRecommend().
 */
export async function trackUserError(userId: string, category: string, subCategory: string | null = null) {
  const supabase = await createClient();

  let existingQuery = supabase
    .from('user_errors')
    .select('id, frequency')
    .eq('user_id', userId)
    .eq('category', category);

  existingQuery = subCategory
    ? existingQuery.eq('sub_category', subCategory)
    : existingQuery.is('sub_category', null);

  const { data: existing } = await existingQuery.maybeSingle();

  if (existing) {
    await supabase
      .from('user_errors')
      .update({
        frequency: existing.frequency + 1,
        last_seen_at: new Date().toISOString()
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('user_errors').insert({
      user_id: userId,
      category,
      sub_category: subCategory,
      frequency: 1,
      last_seen_at: new Date().toISOString()
    });
  }
}

const MAX_PENDING_RECOMMENDATIONS = 3;

/**
 * Analyse les erreurs les plus fréquentes de l'utilisateur (user_errors) pour
 * générer jusqu'à MAX_PENDING_RECOMMENDATIONS recommandations de leçon ciblées,
 * une par catégorie/sous-catégorie d'erreur la plus critique (triées par
 * fréquence décroissante).
 *
 * Fix (2026-07) : filtre par niveau utilisateur + matching sur sous-catégorie
 * (voir historique).
 *
 * Fix (2026-07 bis) : avant ce fix, seule errors[0] (l'erreur la plus
 * fréquente) était jamais transformée en recommandation, malgré le plafond
 * MAX_PENDING_RECOMMENDATIONS = 3 — un utilisateur avec 3 points faibles
 * distincts ne voyait donc qu'une seule recommandation, toujours la même.
 * On boucle maintenant sur le top des erreurs, dans la limite des slots
 * "pending" encore disponibles.
 */
export async function analyzeUserErrorsAndRecommend(userId: string) {
  const supabase = await createClient();

  // 0. Combien de slots de recommandations "pending" restent disponibles
  const { data: existingReco } = await supabase
    .from('recommendations')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'pending');

  const availableSlots = MAX_PENDING_RECOMMENDATIONS - (existingReco?.length ?? 0);
  if (availableSlots <= 0) {
    return;
  }

  // 1. Récupérer les erreurs les plus fréquentes de l'utilisateur
  const { data: errors } = await supabase
    .from('user_errors')
    .select('*')
    .eq('user_id', userId)
    .order('frequency', { ascending: false })
    .limit(MAX_PENDING_RECOMMENDATIONS);

  if (!errors || errors.length === 0) {
    // Fallback : suggérer un type d'exercice général
    await createGenericRecommendation(userId);
    return;
  }

  // 1bis. Niveau actuel de l'utilisateur, pour ne pas recommander hors niveau
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_level')
    .eq('id', userId)
    .single();

  const userLevel = profile?.current_level ?? 'A2';

  // 2. Une recommandation par erreur critique, dans la limite des slots
  // disponibles. Les erreurs les plus fréquentes (donc les plus critiques)
  // sont déjà en tête grâce au tri de l'étape 1.
  for (const topError of errors.slice(0, availableSlots)) {
    let lesson = null;

    if (topError.sub_category) {
      const { data } = await supabase
        .from('lessons')
        .select('id, title, category')
        .eq('category', topError.category.toLowerCase())
        .eq('level', userLevel)
        .ilike('title', `%${topError.sub_category}%`)
        .order('order_index', { ascending: true })
        .limit(1)
        .maybeSingle();
      lesson = data;
    }

    if (!lesson) {
      const { data } = await supabase
        .from('lessons')
        .select('id, title, category')
        .eq('category', topError.category.toLowerCase())
        .eq('level', userLevel)
        .order('order_index', { ascending: true })
        .limit(1)
        .maybeSingle();
      lesson = data;
    }

    if (lesson) {
      // 3. Créer la recommandation de leçon (upsert : pas de doublon si une
      // reco existe déjà pour la même leçon)
      await supabase.from('recommendations').upsert({
        user_id: userId,
        type: 'lesson',
        reference_id: lesson.id,
        reason: `Nous avons remarqué des difficultés récurrentes en ${topError.category}${topError.sub_category ? ` (${topError.sub_category})` : ''}. Cette leçon sur "${lesson.title}" vous aidera à progresser.`,
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
