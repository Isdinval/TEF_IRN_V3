import { SupabaseClient } from '@supabase/supabase-js';
import { Exercise } from './parcours';

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
  2: 'Pour découvrir ce point',
  3: 'Pour progresser sur ce point'
};

/**
 * Moteur de recommandation unifié.
 *
 * Remplace getRecommendedExercises() (lib/parcours.ts) et la logique ad-hoc de
 * practice/page.tsx (fetchFromLesson/autoStart). Priorité stricte par paliers
 * (pas de formule pondérée) :
 *   0. Exercice dû au sens SRS (user_reviews.next_review_at <= maintenant)
 *   1. Même leçon que le contexte fourni (lessonId), pas encore réussi
 *   2. Jamais tenté
 *   3. Déjà tenté, tri par score croissant (le moins bien réussi en premier)
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
): Promise<Exercise[]> {
  // 1. Pool candidat : filtrage level (+ category et/ou tags si fournis), même logique
  //    de casse que l'ancien getRecommendedExercises (exercises.category est contraint en
  //    Capitalisé côté DB alors que lessons.category / parcours.category sont en minuscule)
  let query = supabase
    .from('exercises')
    .select('id, lesson_id, type, level, instructions, category, difficulty, point_clés_lesson')
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

  const { data: exercises, error: exercisesError } = await query.limit(50);

  if (exercisesError || !exercises || exercises.length === 0) return [];

  const exerciseIds = exercises.map((e: { id: string }) => e.id);

  // 2. Signaux, en parallèle
  const [{ data: attempts }, { data: reviews }, { data: errors }] = await Promise.all([
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

  const now = new Date();
  const dueExerciseIds = new Set(
    (reviews || [])
      .filter((r: { next_review_at: string }) => new Date(r.next_review_at) <= now)
      .map((r: { exercise_id: string }) => r.exercise_id)
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
      .filter((ex: any) => (attempts || []).some((a: any) => a.exercise_id === ex.id && a.is_completed))
      .map((ex: any) => ex.point_clés_lesson)
      .filter(Boolean)
  );

  // 3. Scoring : palier principal (priorité stricte) + boost catégorie faible en tri secondaire
  const scored = exercises.map((ex: any) => {
    const exAttempts = (attempts || []).filter((a: any) => a.exercise_id === ex.id);
    const completedAttempts = exAttempts.filter((a: any) => a.is_completed);
    const isCompleted = completedAttempts.length > 0;
    const successRate = isCompleted
      ? Math.max(...completedAttempts.map((a: any) => a.score || 0))
      : undefined;

    let tier: number;
    if (dueExerciseIds.has(ex.id)) {
      tier = 0;
    } else if (context.lessonId && ex.lesson_id === context.lessonId && !isCompleted) {
      tier = 1;
    } else if (!isCompleted) {
      tier = 2;
    } else {
      tier = 3;
    }

    const weakCategoryBoost = topWeakCategory && ex.category?.toLowerCase() === topWeakCategory ? 0 : 1;
    const pointCleAlreadyCovered = !isCompleted && ex.point_clés_lesson && coveredPointsCles.has(ex.point_clés_lesson) ? 1 : 0;
    const reason = ex.point_clés_lesson ? `${TIER_REASONS[tier]} : ${ex.point_clés_lesson}` : TIER_REASONS[tier];

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
