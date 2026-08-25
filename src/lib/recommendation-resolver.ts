import { SupabaseClient } from '@supabase/supabase-js';
import { Exercise } from './parcours';

interface AttemptRow {
  exercise_id: string;
  score: number | null;
  is_completed: boolean;
}

interface ReviewRow {
  exercise_id: string;
  next_review_at: string;
}

interface ErrorRow {
  category: string;
  frequency: number;
}

/** Exercise enrichi du scoring interne du moteur de recommandation — le champ
 *  recommendation_reason (et les autres) est utilisé côté UI (ExerciseCard
 *  variant "hero") pour expliquer pourquoi l'exercice est proposé. */
export interface ScoredExercise extends Exercise {
  tier: number;
  weakCategoryBoost: number;
  pointCleAlreadyCovered: number;
  recommendation_reason: string;
}

export interface ResolveContext {
  level: string;
  /** Si fourni, pool restreint à cette catégorie (cas /parcours/[slug], mono-catégorie).
   *  Si omis, pool multi-catégories sur tout le level — c'est le seul cas où le boost
   *  "catégorie faible" (user_errors) produit un effet observable. */
  category?: string;
  /** Si fourni, restreint en plus aux exercices dont `tags` recoupe cette liste —
   *  typiquement un seul tag précis (la sub_category d'un point faible détecté).
   *  Filtre appliqué EN PLUS de category, pas à sa place : une même étiquette de la
   *  taxonomie officielle peut légitimement exister dans plusieurs catégories
   *  (ex. "négation" en Conjugaison, Grammaire et Syntaxe) — category reste
   *  nécessaire pour lever cette ambiguïté. Sans category fournie en parallèle,
   *  le filtre tags s'applique quand même sur tout le level. */
  tags?: string[];
  /** Leçon en cours ou juste terminée — active le palier "contexte pédagogique". Optionnel. */
  lessonId?: string;
  /** Si fourni, pool restreint à ce type d'exercice (ex: 'trous', 'qcm').
   *  Nécessaire quand l'appelant ne sait traiter qu'un seul format d'exercice
   *  (ex: /grammar-check, /practice). Omis par défaut = tous types confondus,
   *  comportement inchangé pour les appelants existants (/parcours, /lessons). */
  type?: string;
}

const TIER_REASONS: Record<number, string> = {
  0: 'À réviser aujourd\u2019hui',
  1: 'Lié à la leçon que tu viens de terminer',
  2: 'Un autre exercice de cette leçon',
  3: 'Pour découvrir ce point',
  4: 'Pour progresser sur ce point'
};

/**
 * Moteur de recommandation unifié.
 *
 * Remplace getRecommendedExercises() (lib/parcours.ts) et la logique ad-hoc de
 * practice/page.tsx (fetchFromLesson/autoStart). Priorité stricte par paliers
 * (pas de formule pondérée) :
 *   0. Exercice dû au sens SRS (user_reviews.next_review_at <= maintenant)
 *   1. Même leçon que le contexte fourni (lessonId, explicite OU dérivé du tag
 *      -- item 19, voir ci-dessous) ET tag précis matché, pas encore réussi
 *   2. Même leçon que le contexte fourni, tag précis non matché sur CET
 *      exercice précis (voir "Palier 2" ci-dessous), pas encore réussi
 *   3. Jamais tenté (pool hors leçon canonique, ex. autre leçon partageant le tag)
 *   4. Déjà tenté, tri par score croissant (le moins bien réussi en premier)
 *
 * Chaque exercice retourné porte un champ recommendation_reason dérivé de son palier —
 * utilisé côté UI pour expliquer pourquoi il est proposé (cf. ExerciseCard variant "hero").
 *
 * La "catégorie faible" (user_errors) n'est pas un palier à part : elle agit comme
 * boost de tri secondaire. Dans un pool mono-catégorie (context.category fourni,
 * cas /parcours/[slug]), elle n'a mécaniquement aucun effet observable — tout le
 * pool partage déjà la même catégorie. Elle ne redevient utile que si context.category
 * est omis, auquel cas le pool couvre tout le level et le boost peut réellement
 * faire remonter la catégorie où l'utilisateur échoue le plus.
 *
 * Anti-répétition (item 13) : troisième niveau de tri, après le palier et le
 * boost catégorie faible. Au sein d'un même tag, un exercice dont le
 * point_clés_lesson est déjà couvert par un exercice réussi du même pool est
 * déprioritisé face à un point encore jamais abordé — évite de retomber sur
 * le même angle qu'un exercice déjà maîtrisé quand plusieurs sont disponibles.
 */
export async function resolveNextExercises(
  userId: string,
  context: ResolveContext,
  supabase: SupabaseClient,
  limit: number = 6
): Promise<ScoredExercise[]> {
  // Item 19 du plan "Refonte recommandation erreur -> tag -> ressource" :
  // si un tag précis est fourni sans lessonId explicite, on dérive la leçon
  // "canonique" de ce tag (même logique de matching que
  // analyzeUserErrorsAndRecommend) pour activer le palier 1 (ci-dessous) sur
  // SES exercices propres -- sans ça, "Travailler ces exercices" pouvait
  // proposer en premier un exercice cross-tagué d'une tout autre leçon que
  // celle effectivement recommandée juste au-dessus (constaté en test :
  // reco pointant vers la leçon "Subjonctif Présent et Passé", exercices
  // proposés issus de "Voix Passive et Tournures Impersonnelles" -- les deux
  // partagent légitimement le tag, mais l'exercice de la leçon recommandée
  // doit passer en premier).
  let effectiveLessonId = context.lessonId;

  if (!effectiveLessonId && context.tags && context.tags.length > 0) {
    const { data: lessonCandidates } = await supabase
      .from('lessons')
      .select('id, category')
      .eq('level', context.level)
      .overlaps('tags', context.tags)
      .order('order_index', { ascending: true })
      .limit(5);

    if (lessonCandidates && lessonCandidates.length > 0) {
      const preferred = context.category
        ? lessonCandidates.find((l: { id: string; category: string }) => l.category === context.category!.toLowerCase())
        : null;
      effectiveLessonId = (preferred || lessonCandidates[0]).id;
    }
  }

  // 1. Pool candidat : filtrage level (+ category et/ou tags si fournis), même logique
  //    de casse que l'ancien getRecommendedExercises (exercises.category est contraint en
  //    Capitalisé côté DB alors que lessons.category / parcours.category sont en minuscule)
  let query = supabase
    .from('exercises')
    // point_clés_lesson aliasé en point_cles_lesson (ASCII) : le parseur de
    // type de postgrest-js échoue sur un identifiant accentué non guilloté
    // dans la chaîne select() ("Unexpected input: és_lesson", cassait le
    // build Vercel). Alias + guillemets = contournement robuste, plus sûr
    // qu'un simple guillemetage de l'identifiant d'origine.
    .select('id, lesson_id, type, level, instructions, category, difficulty, point_cles_lesson:"point_clés_lesson"')
    .eq('level', context.level);

  if (context.category) {
    const exerciseCategory = context.category.charAt(0).toUpperCase() + context.category.slice(1);
    query = query.or(`category.eq.${exerciseCategory},category.eq.${context.category}`);
  }

  if (context.tags && context.tags.length > 0) {
    query = query.overlaps('tags', context.tags);
  }

  if (context.type) {
    query = query.eq('type', context.type);
  }

  const { data, error: exercisesError } = await query.limit(50);
  if (exercisesError) return [];
  let exercises = (data as Exercise[] | null) || [];

  // Palier 2 (plan "Refonte matching Leçon -> Exercices", item 1) : le filtre
  // `tags overlap` ci-dessus peut ne matcher AUCUN exercice pour un tag pourtant
  // légitime (whitelisté), alors même que la leçon canonique (effectiveLessonId)
  // en possède -- vérifié en base live : 8 couples (tag, niveau) rien que sur la
  // catégorie Conjugaison n'ont aucun exercice tagué exactement, alors qu'AUCUNE
  // leçon n'a jamais 0 exercice (FK exercises.lesson_id garantie non vide, par
  // construction du pipeline de production -- skill llamakusi-tef-exercise-qa
  // génère toujours les exercices lesson par lesson). Sans ce palier, un tag sans
  // exercice exact faisait retomber tout le pool sur le fallback catégorie large
  // de practice/page.tsx#autoStart, sans lien avec la leçon recommandée (bug
  // observé : reco "conjugaison (présent)" niveau B1 -> exercices de "Passé
  // Composé, Imparfait et Plus-que-Parfait", une tout autre leçon). On complète
  // donc TOUJOURS le pool avec les exercices propres à la leçon canonique, tag
  // exact ou pas -- le tri plus bas (tier 1 vs tier 2) garde la priorité au match
  // tag exact quand il existe, ce palier ne fait que combler les trous.
  const tagMatchedIds = new Set(exercises.map((e) => e.id));

  if (effectiveLessonId && context.tags && context.tags.length > 0) {
    let lessonPoolQuery = supabase
      .from('exercises')
      .select('id, lesson_id, type, level, instructions, category, difficulty, point_cles_lesson:"point_clés_lesson"')
      .eq('level', context.level)
      .eq('lesson_id', effectiveLessonId);

    if (context.type) {
      lessonPoolQuery = lessonPoolQuery.eq('type', context.type);
    }

    const { data: lessonPoolData } = await lessonPoolQuery.limit(50);
    const lessonPoolExercises = (lessonPoolData as Exercise[] | null) || [];
    const newOnes = lessonPoolExercises.filter((e) => !tagMatchedIds.has(e.id));
    exercises = [...exercises, ...newOnes];
  }

  if (exercises.length === 0) return [];

  const exerciseIds = exercises.map((e) => e.id);

  // 2. Signaux, en parallèle
  const [attemptsResult, reviewsResult, errorsResult] = await Promise.all([
    supabase
      .from('exercise_attempts')
      .select('exercise_id, score, is_completed')
      .eq('user_id', userId)
      .in('exercise_id', exerciseIds),
    supabase
      .from('user_reviews')
      .select('exercise_id, next_review_at')
      .eq('user_id', userId)
      .in('exercise_id', exerciseIds),
    supabase
      .from('user_errors')
      .select('category, frequency')
      .eq('user_id', userId)
      .order('frequency', { ascending: false })
      .limit(1)
  ]);
  const attempts = attemptsResult.data as AttemptRow[] | null;
  const reviews = reviewsResult.data as ReviewRow[] | null;
  const errors = errorsResult.data as ErrorRow[] | null;

  const now = new Date();
  const dueExerciseIds = new Set(
    (reviews || [])
      .filter((r) => new Date(r.next_review_at) <= now)
      .map((r) => r.exercise_id)
  );
  const topWeakCategory = errors?.[0]?.category?.toLowerCase();

  // Anti-répétition (item 13 du plan "Refonte recommandation erreur -> tag ->
  // ressource") : point_clés_lesson distingue plusieurs exercices qui
  // partagent le même tag (ex. "subjonctif présent" décliné en "formation
  // -RE" vs "verbes irréguliers"). Un point déjà couvert par un exercice
  // réussi du pool est déprioritisé face à un point encore jamais abordé,
  // pour varier les angles proposés plutôt que de toujours retomber sur le
  // même point_clés_lesson.
  const coveredPointsCles = new Set(
    exercises
      .filter((ex) => (attempts || []).some((a) => a.exercise_id === ex.id && a.is_completed))
      .map((ex) => ex.point_cles_lesson)
      .filter(Boolean)
  );

  // 3. Scoring : palier principal (priorité stricte) + boost catégorie faible en tri secondaire
  const scored: ScoredExercise[] = exercises.map((ex) => {
    const exAttempts = (attempts || []).filter((a) => a.exercise_id === ex.id);
    const completedAttempts = exAttempts.filter((a) => a.is_completed);
    const isCompleted = completedAttempts.length > 0;
    const successRate = isCompleted
      ? Math.max(...completedAttempts.map((a) => a.score || 0))
      : undefined;

    let tier: number;
    if (dueExerciseIds.has(ex.id)) {
      tier = 0;
    } else if (effectiveLessonId && ex.lesson_id === effectiveLessonId && tagMatchedIds.has(ex.id) && !isCompleted) {
      tier = 1;
    } else if (effectiveLessonId && ex.lesson_id === effectiveLessonId && !isCompleted) {
      tier = 2;
    } else if (!isCompleted) {
      tier = 3;
    } else {
      tier = 4;
    }

    const weakCategoryBoost = topWeakCategory && ex.category?.toLowerCase() === topWeakCategory ? 0 : 1;
    const pointCleAlreadyCovered = !isCompleted && ex.point_cles_lesson && coveredPointsCles.has(ex.point_cles_lesson) ? 1 : 0;
    const reason = ex.point_cles_lesson ? `${TIER_REASONS[tier]} : ${ex.point_cles_lesson}` : TIER_REASONS[tier];

    return {
      ...ex,
      tier,
      weakCategoryBoost,
      pointCleAlreadyCovered,
      recommendation_reason: reason,
      is_completed: isCompleted,
      success_rate: successRate,
      attempts_count: exAttempts.length
    };
  });

  scored.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (a.weakCategoryBoost !== b.weakCategoryBoost) return a.weakCategoryBoost - b.weakCategoryBoost;
    if (a.pointCleAlreadyCovered !== b.pointCleAlreadyCovered) return a.pointCleAlreadyCovered - b.pointCleAlreadyCovered;
    return (a.success_rate ?? 0) - (b.success_rate ?? 0);
  });

  return scored.slice(0, limit);
}
