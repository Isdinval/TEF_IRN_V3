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
 * Fait baisser (ou supprime) une ligne user_errors précise (category +
 * sub_category exacts), en réaction à une réussite. Extrait de
 * resolveUserError() pour être appelable deux fois (cf. fallback ci-dessous).
 */
async function resolveUserErrorRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  category: string,
  subCategory: string | null
) {
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
 * Fait baisser (ou supprime) le compteur d'erreurs de l'utilisateur pour une
 * catégorie donnée, en réaction à une réussite (score >= 50). Symétrique de
 * trackUserError. Un seul succès suffit à faire baisser frequency de 1 ; la
 * ligne user_errors est supprimée quand frequency atteint 0 (le point faible
 * disparaît alors du widget "Points faibles" du dashboard).
 *
 * Fallback (item 2 du plan "Refonte recommandation erreur -> tag -> ressource") :
 * un point faible générique (sub_category = null -- typiquement remonté par
 * l'Oral, qui ne peut pas isoler une notion précise) ne peut jamais matcher
 * le sub_category d'un exercice ciblé réussi (qui en a presque toujours un,
 * cf. exercise-complete/route.ts). Sans ce fallback, un tel point faible
 * restait bloqué indéfiniment dans le dashboard. N'importe quelle réussite
 * dans la même catégorie compte donc aussi comme un progrès sur ce signal
 * générique -- contrairement à un point précis (ex. "subjonctif présent"),
 * qui lui continue d'exiger une réussite sur ce point précis, jamais un
 * succès générique d'une autre notion de la catégorie.
 */
export async function resolveUserError(userId: string, category: string, subCategory: string | null = null) {
  const supabase = await createClient();

  await resolveUserErrorRow(supabase, userId, category, subCategory);

  if (subCategory) {
    await resolveUserErrorRow(supabase, userId, category, null);
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
 * générer jusqu'à MAX_PENDING_RECOMMENDATIONS recommandations ciblées, une
 * par catégorie/sous-catégorie d'erreur la plus critique (triées par
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
 *
 * Gradation exercice/leçon (item 10 du plan "Refonte recommandation erreur ->
 * tag -> ressource") : une leçon déjà lue (lesson_progress) n'est pas
 * reproposée pour une erreur fraîche (frequency=1) -- seuls des exercices
 * ciblés sur le tag précis sont recommandés, la relire n'apporterait rien de
 * plus qu'un exercice ciblé. Elle est en revanche reproposée, en rappel,
 * si l'erreur persiste malgré tout (frequency>=2) : signe que la lecture
 * seule n'a pas suffi. Une leçon jamais lue reste toujours prioritaire
 * (comportement inchangé), quelle que soit frequency.
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

  // 1. Récupérer les erreurs de l'utilisateur (pool large, pas encore limité
  // à MAX_PENDING_RECOMMENDATIONS -- la dépriorisation ci-dessous doit voir
  // l'ensemble avant de décider lesquelles passent en tête).
  const { data: rawErrors } = await supabase
    .from('user_errors')
    .select('*')
    .eq('user_id', userId)
    .order('frequency', { ascending: false })
    .limit(50);

  if (!rawErrors || rawErrors.length === 0) {
    // Fallback : suggérer un type d'exercice général
    await createGenericRecommendation(userId);
    return;
  }

  // Dépriorisation (item 11 du plan "Refonte recommandation erreur -> tag ->
  // ressource") : un point faible ancien (last_seen_at > 30 jours) ne doit
  // pas monopoliser un slot de recommandation face à des erreurs plus
  // récentes, même à fréquence égale ou supérieure -- même principe que le
  // tri du widget "Points faibles" (get_dashboard_data, migration
  // 20260817000004). Dépriorisation seulement : la ligne user_errors n'est
  // ni modifiée ni supprimée ici, uniquement reléguée dans ce tri.
  const STALE_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const errors = [...rawErrors].sort((a, b) => {
    const aStale = now - new Date(a.last_seen_at).getTime() > STALE_THRESHOLD_MS;
    const bStale = now - new Date(b.last_seen_at).getTime() > STALE_THRESHOLD_MS;
    if (aStale !== bStale) return aStale ? 1 : -1;
    if (a.frequency !== b.frequency) return b.frequency - a.frequency;
    return new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime();
  });

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
      //
      // Plusieurs leçons peuvent légitimement partager le même tag (ex.
      // "être"/"avoir" couvrent 12 leçons chacun) -- item 15 du plan : on
      // récupère jusqu'à 5 candidates et on préfère la première non encore
      // lue par l'utilisateur, plutôt que de s'arrêter systématiquement à la
      // première par order_index qui pourrait déjà être connue.
      const { data: candidates } = await supabase
        .from('lessons')
        .select('id, title, category')
        .eq('category', topError.category.toLowerCase())
        .eq('level', userLevel)
        .overlaps('tags', [topError.sub_category])
        .order('order_index', { ascending: true })
        .limit(5);

      if (candidates && candidates.length > 0) {
        if (candidates.length === 1) {
          lesson = candidates[0];
        } else {
          const { data: readRows } = await supabase
            .from('lesson_progress')
            .select('lesson_id')
            .eq('user_id', userId)
            .in('lesson_id', candidates.map((c) => c.id));
          const readIds = new Set((readRows || []).map((r) => r.lesson_id));
          lesson = candidates.find((c) => !readIds.has(c.id)) || candidates[0];
        }
      }
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
      const { data: progress } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('lesson_id', lesson.id)
        .maybeSingle();

      const alreadyRead = !!progress;
      const isPersistent = topError.frequency >= 2;

      if (alreadyRead && !isPersistent) {
        // Faiblesse légère sur une notion déjà lue : exercices ciblés sur le
        // tag précis suffisent, pas besoin de reproposer la leçon.
        await supabase.from('recommendations').insert({
          user_id: userId,
          type: 'exercise',
          category: topError.category.toLowerCase(),
          sub_category: topError.sub_category,
          reason: `Un point à retravailler en ${topError.category}${topError.sub_category ? ` (${topError.sub_category})` : ''} : quelques exercices ciblés suffiront.`,
          status: 'pending'
        });
      } else {
        // Leçon jamais lue (comportement d'origine), ou erreur persistante
        // malgré une leçon déjà lue (rappel explicite dans le libellé).
        const reason = alreadyRead && isPersistent
          ? `Cette erreur revient malgré la leçon déjà vue (${topError.frequency}x) en ${topError.category}${topError.sub_category ? ` (${topError.sub_category})` : ''}. Un rappel de "${lesson.title}", complété par des exercices ciblés, vous aidera à l'ancrer.`
          : `Nous avons remarqué des difficultés récurrentes en ${topError.category}${topError.sub_category ? ` (${topError.sub_category})` : ''}. Cette leçon sur "${lesson.title}" vous aidera à progresser.`;

        // 3. Créer la recommandation de leçon (upsert : pas de doublon si une
        // reco existe déjà pour la même leçon)
        await supabase.from('recommendations').upsert({
          user_id: userId,
          type: 'lesson',
          reference_id: lesson.id,
          category: topError.category.toLowerCase(),
          sub_category: topError.sub_category,
          reason,
          status: 'pending'
        }, { onConflict: 'user_id, reference_id' });
      }
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
