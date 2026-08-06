import { createClient } from './supabase-server';

/**
 * Incrémente (ou crée) le compteur d'erreurs de l'utilisateur pour une catégorie donnée.
 * Alimente user_errors, qui est la source de données de analyzeUserErrorsAndRecommend().
 *
 * sourceLabel : origine de CETTE occurrence ('Exercice ciblé', 'Écrit', 'Oral',
 * 'Examen blanc'...), écrasée à chaque appel pour refléter la dernière occurrence
 * -- utilisé par la card "En attente d'une action ciblée" du dashboard pour un
 * rappel contextualisé (item 10.3).
 */
export async function trackUserError(userId: string, category: string, subCategory: string | null = null, sourceLabel: string | null = null) {
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
        last_seen_at: new Date().toISOString(),
        source_label: sourceLabel
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('user_errors').insert({
      user_id: userId,
      category,
      sub_category: subCategory,
      frequency: 1,
      last_seen_at: new Date().toISOString(),
      source_label: sourceLabel
    });
  }
}

/**
 * Fait baisser (ou supprime) le compteur d'erreurs de l'utilisateur pour une
 * catégorie donnée, en réaction à une réussite (score >= 50). Symétrique de
 * trackUserError. Un seul succès suffit à faire baisser frequency de 1 ; la
 * ligne user_errors est supprimée quand frequency atteint 0 (le point faible
 * disparaît alors du widget "Points faibles" du dashboard).
 */
export async function resolveUserError(userId: string, category: string, subCategory: string | null = null) {
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

  if (!existing) return;

  if (existing.frequency <= 1) {
    await supabase.from('user_errors').delete().eq('id', existing.id);
  } else {
    await supabase
      .from('user_errors')
      .update({ frequency: existing.frequency - 1 })
      .eq('id', existing.id);
  }
}

/**
 * Marque une recommandation de type 'lesson' comme 'completed' si, ET
 * SEULEMENT SI, les deux conditions sont réunies :
 *   1. La leçon recommandée vient d'être terminée (appelé depuis
 *      exercise-complete/route.ts quand le mini-quiz de cette leçon est
 *      réussi, score >= 50).
 *   2. Le point faible (category/sub_category) qui avait généré cette
 *      recommandation n'existe plus dans user_errors (résolu, éventuellement
 *      par un tout autre exercice avant même que la leçon soit terminée).
 * Si le point faible existe encore, la recommandation reste 'pending' —
 * terminer la leçon ne suffit pas à elle seule.
 */
export async function completeRecommendationIfResolved(userId: string, lessonId: string) {
  const supabase = await createClient();

  const { data: reco } = await supabase
    .from('recommendations')
    .select('id, category, sub_category')
    .eq('user_id', userId)
    .eq('type', 'lesson')
    .eq('reference_id', lessonId)
    .eq('status', 'pending')
    .maybeSingle();

  if (!reco || !reco.category) return;

  let stillWeakQuery = supabase
    .from('user_errors')
    .select('id')
    .eq('user_id', userId)
    .eq('category', reco.category);

  stillWeakQuery = reco.sub_category
    ? stillWeakQuery.eq('sub_category', reco.sub_category)
    : stillWeakQuery.is('sub_category', null);

  const { data: stillWeak } = await stillWeakQuery.maybeSingle();

  if (!stillWeak) {
    await supabase.from('recommendations').update({ status: 'completed' }).eq('id', reco.id);
  }
}

const MAX_PENDING_RECOMMENDATIONS = 3;

/**
 * Analyse les erreurs les plus fréquentes de l'utilisateur (user_errors) pour
 * générer jusqu'à MAX_PENDING_RECOMMENDATIONS recommandations de leçon ciblées,
 * une par catégorie/sous-catégorie d'erreur la plus critique (triées par
 * fréquence décroissante).
 *
 * Fix (2026-07) : filtre par niveau utilisateur + matching sur sous-catégorie.
 *
 * Fix (2026-07 bis) : boucle sur le top des erreurs au lieu de la seule
 * errors[0], dans la limite des slots "pending" encore disponibles — sinon
 * un utilisateur avec 3 points faibles distincts ne voyait qu'une seule
 * recommandation, toujours la même.
 *
 * Fix (2026-07 ter) : chaque recommandation de leçon stocke désormais
 * category/sub_category (voir migration 20260720000001), nécessaire à
 * completeRecommendationIfResolved() pour détecter la résolution du point
 * faible qui l'a générée.
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
      // Rapprochement fiable sur les étiquettes (taxonomie officielle, voir
      // docs/lessons-tags-taxonomy.md) plutôt qu'une recherche de texte dans
      // le titre -- fragile car le titre d'une leçon ne contient pas
      // forcément le mot exact de la sous-catégorie (ex. "comparatifs" ne
      // matchait jamais le titre "Comparer et Exprimer ses Préférences").
      const { data } = await supabase
        .from('lessons')
        .select('id, title, category')
        .eq('category', topError.category.toLowerCase())
        .eq('level', userLevel)
        .overlaps('tags', [topError.sub_category])
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
        category: topError.category.toLowerCase(),
        sub_category: topError.sub_category,
        reason: `Nous avons remarqué des difficultés récurrentes en ${topError.category}${topError.sub_category ? ` (${topError.sub_category})` : ''}. Cette leçon sur "${lesson.title}" vous aidera à progresser.`,
        status: 'pending'
      }, { onConflict: 'user_id, reference_id' });
    } else {
      // 4. Si pas de leçon spécifique, suggérer de l'entraînement dans cette catégorie
      await supabase.from('recommendations').insert({
        user_id: userId,
        type: 'exercise',
        category: topError.category.toLowerCase(),
        sub_category: topError.sub_category,
        reason: `Besoin d'entraînement en ${topError.category} ? Faire 10 exercices de type QCM pour renforcer vos bases.`,
        status: 'pending'
      });
    }
  }
}

/**
 * Analyse le SRS vocabulaire (user_vocabulary_reviews) pour détecter un mot
 * en difficulté et générer une recommandation type 'vocab'.
 *
 * Signal de difficulté : ease_factor <= 2.0 (abaissé sous le défaut 2.5 par
 * updateVocabularySRS() sur échec, voir src/lib/srs-engine.ts) ET
 * consecutive_correct = 0 (dernier essai raté, pas juste un ancien échec déjà
 * rattrapé depuis). Une seule recommandation 'vocab' pending à la fois :
 * le SRS est déjà pressant au quotidien (tuile de révisions dans le Plan
 * d'action), pas besoin d'en
 * empiler plusieurs.
 */
const MAX_PENDING_VOCAB_RECOMMENDATIONS = 1;

export async function analyzeVocabStruggleAndRecommend(userId: string) {
  const supabase = await createClient();

  const { data: existingVocabReco } = await supabase
    .from('recommendations')
    .select('id')
    .eq('user_id', userId)
    .eq('type', 'vocab')
    .eq('status', 'pending')
    .limit(MAX_PENDING_VOCAB_RECOMMENDATIONS)
    .maybeSingle();

  if (existingVocabReco) return;

  const { data: struggling } = await supabase
    .from('user_vocabulary_reviews')
    .select('vocab_id, ease_factor, vocabulary(word, category)')
    .eq('user_id', userId)
    .eq('consecutive_correct', 0)
    .lte('ease_factor', 2.0)
    .order('ease_factor', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!struggling) return;

  const vocabWord = Array.isArray(struggling.vocabulary) ? struggling.vocabulary[0] : struggling.vocabulary;
  if (!vocabWord) return;

  await supabase.from('recommendations').upsert({
    user_id: userId,
    type: 'vocab',
    reference_id: struggling.vocab_id,
    category: vocabWord.category,
    reason: `Le mot "${vocabWord.word}" vous résiste malgré plusieurs révisions. Reprenez-le pour bien l'ancrer.`,
    status: 'pending'
  }, { onConflict: 'user_id, reference_id' });
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
