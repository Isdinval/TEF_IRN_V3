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
 * Analyse les erreurs récentes de l'utilisateur (user_errors) pour générer une
 * recommandation de leçon ciblée.
 *
 * Seule fonction du moteur : generateRecommendation() a été retirée (Phase 5) —
 * elle recalculait la même information en re-scannant exercise_attempts + une
 * jointure exercises à chaque appel, alors que user_errors (Phase 1) est déjà
 * la source fiable et agrégée pour ce signal. Son seul apport réel, le plafond
 * à MAX_PENDING_RECOMMENDATIONS pour ne pas empiler les recommandations, est
 * repris ci-dessous.
 *
 * Fix (2026-07) : la leçon recommandée est désormais filtrée par le niveau
 * actuel de l'utilisateur (profiles.current_level) et, quand une sous-catégorie
 * d'erreur existe (ex: "avoir"), on tente d'abord de matcher une leçon dont le
 * titre la mentionne. Avant ce fix, la requête ne filtrait que sur `category`
 * sans ORDER BY : elle pouvait renvoyer une leçon de niveau B2 sans rapport
 * avec l'erreur précise de l'utilisateur (voir bug rapporté : leçon
 * "Subjonctif Présent et Passé... B2" recommandée à un utilisateur A2 en
 * difficulté sur "avoir").
 * Note : lessons.tags est documentée comme corrompue dans
 * 20260719000002_manual_tagging_all_exercises.sql — ne pas s'y fier, d'où le
 * choix d'un ILIKE sur le titre plutôt qu'un filtre sur tags.
 */
export async function analyzeUserErrorsAndRecommend(userId: string) {
  const supabase = await createClient();

  // 0. Ne pas empiler les recommandations indéfiniment
  const { data: existingReco } = await supabase
    .from('recommendations')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .limit(MAX_PENDING_RECOMMENDATIONS);

  if (existingReco && existingReco.length >= MAX_PENDING_RECOMMENDATIONS) {
    return;
  }

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

  // 1bis. Niveau actuel de l'utilisateur, pour ne pas recommander hors niveau
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_level')
    .eq('id', userId)
    .single();

  const userLevel = profile?.current_level ?? 'A2';

  // 2. Chercher une leçon qui correspond à la catégorie ET au niveau de
  // l'erreur, en priorisant une leçon dont le titre mentionne la
  // sous-catégorie précise (ex: "avoir")
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
    // 3. Créer la recommandation de leçon
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
