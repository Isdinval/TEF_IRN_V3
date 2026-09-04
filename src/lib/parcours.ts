import { createClient } from './supabase';
import { SupabaseClient } from '@supabase/supabase-js';

const defaultSupabase = createClient();

export interface Parcours {
  id: string;
  slug: string;
  level: string;
  category: string;
  objective: string;
  nom_parcours?: string | null;
  justification_reference_au_referentiel?: string | null;
}

export interface ParcoursProgress {
  total: number;
  completed: number;
  percent: number;
  isCompleted: boolean;
  completedLessons: string[];
  status?: 'not_started' | 'in_progress' | 'completed';
  started_at?: string | null;
}

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  order_index: number;
  level: string;
  category: string;
  duration?: number;
  difficulty?: 'facile' | 'moyen' | 'difficile';
  objective?: string;
  content?: string;
  /** Thématique(s) VOCAB_CATEGORIES (src/lib/vocab/categories.ts) associée(s) à
   *  cette leçon, uniquement pertinent pour category='vocabulaire'. [] ou
   *  undefined légitime pour les leçons sans ancrage thématique-lexical
   *  (Registre de Langue, Collocations, Valeurs de la République). */
  vocab_theme_categories?: string[];
}

export interface Exercise {
  id: string;
  lesson_id: string | null;
  type: string;
  level: string;
  instructions: string;
  category: string;
  difficulty: 'facile' | 'moyen' | 'difficile';
  // Libellé différenciateur entre plusieurs exercices d'une même leçon
  // partageant le même tag (ex. "Formation du subjonctif présent - verbes
  // en -RE" vs "...verbes irréguliers"). Jamais utilisé pour le matching
  // (voir docs/lessons-tags-taxonomy.md), uniquement pour varier les
  // exercices proposés et enrichir le libellé affiché (item 13 du plan).
  // Aliasé en ASCII (point_cles_lesson) côté requête Supabase -- le nom
  // de colonne réel en base reste point_clés_lesson, mais un identifiant
  // accentué non guilloté fait échouer le parseur de type de postgrest-js
  // (cf. recommendation-resolver.ts).
  point_cles_lesson?: string | null;
  // Intitulé pédagogique court dérivé de point_cles_lesson (skill
  // llamakusi-point-cle-pedagogique), utilisé comme label d'affichage dans
  // les catalogues à la place du point-clé factuel brut. Colonne ASCII pure,
  // pas d'alias nécessaire côté requête Supabase.
  point_cle_pedagogique?: string | null;
  success_rate?: number;
  attempts_count?: number;
}

/**
 * URL cible d'un exercice selon son type (qcm/association/qcm_centre_entrainement
 * -> /practice, trous -> /grammar-check, ecrit -> /writing, défaut -> /practice).
 *
 * Extrait de ExerciseCard.tsx (getExerciseUrl, closure locale) pour être
 * réutilisable depuis ParcoursContext.tsx (bouton "Exercice suivant" de la
 * TopBar) sans dupliquer le switch de routes -- même logique, aucun
 * comportement changé pour ExerciseCard.
 */
export function getExerciseUrl(
  exercise: Pick<Exercise, 'id' | 'type' | 'category' | 'level'>,
  parcoursId?: string
): string {
  const params = new URLSearchParams({
    topic: exercise.category,
    level: exercise.level
  });

  if (parcoursId) {
    params.set("parcoursId", parcoursId);
  }

  switch (exercise.type) {
    case 'qcm':
    case 'association':
    case 'qcm_centre_entrainement':
      return `/tef-irn/practice/${exercise.id}?${params.toString()}`;
    case 'trous':
      return `/tef-irn/grammar-check/${exercise.id}?${params.toString()}`;
    case 'ecrit':
      return `/tef-irn/writing/${exercise.id}?${params.toString()}`;
    default:
      return `/tef-irn/practice/${exercise.id}?${params.toString()}`;
  }
}

export async function getParcours(supabase: SupabaseClient = defaultSupabase): Promise<Parcours[]> {
  const { data, error } = await supabase
    .from('parcours')
    .select('id, slug, level, category, objective, nom_parcours, justification_reference_au_referentiel')
    .order('level', { ascending: true })
    .order('category', { ascending: true });

  if (error) {
    console.error('Error fetching parcours:', error);
    return [];
  }

  return data || [];
}

export async function getParcoursProgress(
  userId: string,
  level: string,
  category: string,
  parcoursId?: string,
  supabase: SupabaseClient = defaultSupabase
): Promise<ParcoursProgress> {
  // 1. Fetch user progress from user_parcours_progress + 2. lessons du niveau/catégorie
  // Requêtes indépendantes l'une de l'autre : exécutées en parallèle plutôt qu'en
  // série pour réduire le nombre d'aller-retours réseau séquentiels.
  const [userProgressResult, lessonsResult] = await Promise.all([
    parcoursId
      ? supabase
          .from('user_parcours_progress')
          .select('status, started_at')
          .eq('user_id', userId)
          .eq('parcours_id', parcoursId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('lessons')
      .select('id')
      .eq('level', level)
      .eq('category', category),
  ]);

  const userProgress = userProgressResult.data;
  const { data: lessons, error: lessonsError } = lessonsResult;

  if (lessonsError || !lessons) {
    return {
      total: 0,
      completed: 0,
      percent: 0,
      isCompleted: false,
      completedLessons: [],
      status: userProgress?.status,
      started_at: userProgress?.started_at
    };
  }

  const total = lessons.length;
  if (total === 0) return {
    total: 0,
    completed: 0,
    percent: 0,
    isCompleted: false,
    completedLessons: [],
    status: userProgress?.status,
    started_at: userProgress?.started_at
  };

  const lessonIds = lessons.map((l: { id: string }) => l.id);

  const { data: progress, error: progressError } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds);

  if (progressError) {
    return {
      total,
      completed: 0,
      percent: 0,
      isCompleted: false,
      completedLessons: [],
      status: userProgress?.status,
      started_at: userProgress?.started_at
    };
  }

  const completedLessonIds = progress?.map((p: { lesson_id: string }) => p.lesson_id) || [];
  const completed = completedLessonIds.length;
  const percent = Math.round((completed / total) * 100);
  const isCompleted = completed === total && total > 0;

  return {
    total,
    completed,
    percent,
    isCompleted,
    completedLessons: completedLessonIds,
    status: userProgress?.status,
    started_at: userProgress?.started_at
  };
}

export async function getParcoursById(id: string, supabase: SupabaseClient = defaultSupabase): Promise<Parcours | null> {
  const { data, error } = await supabase
    .from('parcours')
    .select('id, slug, level, category, objective, nom_parcours, justification_reference_au_referentiel')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching parcours by id:', error);
    return null;
  }

  return data;
}

export async function getParcoursBySlug(slug: string, supabase: SupabaseClient = defaultSupabase): Promise<Parcours | null> {
  const { data, error } = await supabase
    .from('parcours')
    .select('id, slug, level, category, objective, nom_parcours, justification_reference_au_referentiel')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching parcours by slug:', error);
    return null;
  }

  return data;
}

/**
 * Détermine l'ensemble des leçons "débloquées" d'un parcours : toutes les
 * leçons déjà complétées, plus la première leçon non complétée dans l'ordre
 * (`order_index`) -- la leçon "en cours". Les leçons suivantes ne sont PAS
 * incluses : elles restent atteignables manuellement (LessonCard n'impose
 * aucune restriction de clic, hors scope ici), mais ne doivent jamais être
 * proposées automatiquement par le moteur de recommandation (paliers 1-4 de
 * resolveNextExercises()) ni par le bouton "Exercice" de la TopBar, avant que
 * l'utilisateur les ait atteintes dans l'ordre du parcours.
 *
 * Même critère de "leçon suivante" que resolveContextLesson() (ParcoursContext.tsx)
 * et lessonsWithStatus (ParcoursInteractive.tsx) -- centralisé ici pour être
 * partagé aussi par resolveNextExercises() (recommendation-resolver.ts) sans
 * tripler la même logique à trois endroits.
 */
export function getUnlockedLessonIds(lessons: Lesson[], completedLessonIds: string[]): Set<string> {
  const completed = new Set(completedLessonIds);
  const unlocked = new Set<string>();
  let nextFound = false;

  for (const lesson of lessons) {
    if (completed.has(lesson.id)) {
      unlocked.add(lesson.id);
    } else if (!nextFound) {
      unlocked.add(lesson.id);
      nextFound = true;
    }
  }

  return unlocked;
}

export interface RemainingExerciseCounts {
  qcm: number;
  trous: number;
}

/**
 * Compte les exercices de type 'qcm' et 'trous' encore à faire (pas complétés
 * par l'utilisateur) parmi les leçons débloquées d'un parcours -- item #4 du
 * plan "Verrouillage exercices topbar/parcours" : alimente les compteurs
 * affichés sur les boutons de la TopBar. Même périmètre que
 * resolveNextExercises() + getUnlockedLessonIds(), volontairement séparé du
 * moteur de scoring (recommendation-resolver.ts) : un simple compte n'a pas
 * besoin des paliers/raisons de recommandation.
 *
 * Les exercices sans lesson_id ne sont jamais comptés ici (aucun cas connu
 * en production -- voir recommendation-resolver.ts) : rattachés à aucune
 * leçon, ils ne peuvent pas être positionnés dans un pool "débloqué".
 */
export async function getRemainingExerciseCounts(
  userId: string,
  level: string,
  category: string,
  unlockedLessonIds: Set<string>,
  supabase: SupabaseClient = defaultSupabase
): Promise<RemainingExerciseCounts> {
  if (unlockedLessonIds.size === 0) return { qcm: 0, trous: 0 };

  const lessonIds = Array.from(unlockedLessonIds);
  // Même divergence de casse que resolveNextExercises() : exercises.category
  // est Capitalisé en base alors que parcours.category est en minuscule.
  // Item 7 (doc vocabulaire-particularites-recommandation.md) : "vocabulaire"
  // ne filtre jamais sur category, exercises.category n'y vaut jamais
  // "Vocabulaire" en base.
  const isVocabulaireCategory = category.toLowerCase() === 'vocabulaire';
  const exerciseCategory = category.charAt(0).toUpperCase() + category.slice(1);

  let query = supabase
    .from('exercises')
    .select('id, type')
    .eq('level', level)
    .in('lesson_id', lessonIds)
    .in('type', ['qcm', 'trous']);

  if (!isVocabulaireCategory) {
    query = query.or(`category.eq.${exerciseCategory},category.eq.${category}`);
  }

  const { data: exercises, error } = await query;
  if (error || !exercises || exercises.length === 0) return { qcm: 0, trous: 0 };

  const exerciseIds = exercises.map((e: { id: string }) => e.id);

  const { data: attempts } = await supabase
    .from('exercise_attempts')
    .select('exercise_id')
    .eq('user_id', userId)
    .eq('is_completed', true)
    .in('exercise_id', exerciseIds);

  const completedIds = new Set((attempts || []).map((a: { exercise_id: string }) => a.exercise_id));

  const counts: RemainingExerciseCounts = { qcm: 0, trous: 0 };
  for (const ex of exercises as { id: string; type: string }[]) {
    if (completedIds.has(ex.id)) continue;
    if (ex.type === 'qcm') counts.qcm++;
    else if (ex.type === 'trous') counts.trous++;
  }

  return counts;
}

/**
 * Récupère le catalogue COMPLET (pas juste le top recommandé) des exercices
 * rattachés aux leçons débloquées d'un parcours, avec statut is_completed /
 * attempts_count par exercice -- item #6 du plan "Verrouillage exercices
 * topbar/parcours" : alimente l'accordéon de /parcours/[slug] (même principe
 * que fetchCatalogue() côté client dans grammar-check/page.tsx et
 * practice/page.tsx, mais scopé aux leçons débloquées plutôt qu'à un seul
 * type d'exercice -- l'accordéon de /parcours/[slug] mélange qcm et trous,
 * contrairement aux catalogues mono-type de ces deux pages).
 *
 * Contrairement à resolveNextExercises(), aucun scoring/tri par palier ici :
 * un catalogue affiche tout, dans l'ordre naturel de la leçon -- le tri
 * pédagogique (SRS dû, leçon en cours...) reste le rôle exclusif du hero
 * recommandé au-dessus de l'accordéon.
 */
export async function getUnlockedExercisesCatalogue(
  level: string,
  category: string,
  unlockedLessonIds: Set<string>,
  userId: string | null,
  supabase: SupabaseClient = defaultSupabase
): Promise<(Exercise & { is_completed?: boolean; attempts_count?: number })[]> {
  if (unlockedLessonIds.size === 0) return [];

  const lessonIds = Array.from(unlockedLessonIds);
  // Même divergence de casse + exception vocabulaire que getRemainingExerciseCounts()
  // et resolveNextExercises() ci-dessus.
  const isVocabulaireCategory = category.toLowerCase() === 'vocabulaire';
  const exerciseCategory = category.charAt(0).toUpperCase() + category.slice(1);

  let query = supabase
    .from('exercises')
    .select('id, lesson_id, type, level, instructions, category, difficulty, point_cles_lesson:"point_clés_lesson", point_cle_pedagogique')
    .eq('level', level)
    .in('lesson_id', lessonIds);

  if (!isVocabulaireCategory) {
    query = query.or(`category.eq.${exerciseCategory},category.eq.${category}`);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  const exercises = data as Exercise[];
  if (exercises.length === 0 || !userId) return exercises;

  const { data: attempts } = await supabase
    .from('exercise_attempts')
    .select('exercise_id, is_completed')
    .eq('user_id', userId)
    .in('exercise_id', exercises.map((e) => e.id));

  const completedIds = new Set(
    (attempts || []).filter((a: { is_completed: boolean }) => a.is_completed).map((a: { exercise_id: string }) => a.exercise_id)
  );
  const attemptCounts = new Map<string, number>();
  (attempts || []).forEach((a: { exercise_id: string }) => {
    attemptCounts.set(a.exercise_id, (attemptCounts.get(a.exercise_id) || 0) + 1);
  });

  return exercises.map((ex) => ({
    ...ex,
    is_completed: completedIds.has(ex.id),
    attempts_count: attemptCounts.get(ex.id) || 0,
  }));
}

/**
 * Calcule les leçons débloquées (complétées + leçon en cours, cf.
 * getUnlockedLessonIds ci-dessus) du parcours niveau/catégorie que
 * l'utilisateur est réellement en train de faire -- item #6 du plan
 * "remontées LlamaKusi août 2026" : scope la recommandation "Lancer mon
 * exercice recommandé" de /grammar-check et /practice aux exercices du
 * parcours en cours plutôt qu'à tout le pool niveau/catégorie.
 *
 * Retourne `null` (plutôt qu'un Set vide) dans deux cas : aucun parcours ne
 * correspond au couple niveau/catégorie, ou l'utilisateur ne l'a pas encore
 * entamé (aucune leçon complétée) ou l'a déjà entièrement terminé -- dans ces
 * deux cas ce n'est pas un "parcours en cours", l'appelant doit retomber sur
 * le pool non scopé existant (fallback validé avec Olivier).
 */
export async function getUnlockedLessonIdsForInProgressParcours(
  userId: string,
  level: string,
  category: string,
  supabase: SupabaseClient = defaultSupabase
): Promise<Set<string> | null> {
  // parcours.category et lessons.category sont stockés en minuscule en base,
  // alors que les appelants (filtres UI de /grammar-check et /practice)
  // passent une catégorie capitalisée (ex. "Conjugaison") -- même divergence
  // de casse que getRemainingExerciseCounts() plus haut dans ce fichier.
  const normalizedCategory = category.toLowerCase();

  const { data: parcours } = await supabase
    .from('parcours')
    .select('id')
    .eq('level', level)
    .eq('category', normalizedCategory)
    .maybeSingle();

  if (!parcours) return null;

  const progress = await getParcoursProgress(userId, level, normalizedCategory, parcours.id, supabase);
  if (progress.completed === 0 || progress.isCompleted) return null;

  const lessons = await getLessonsForParcours(level, normalizedCategory, supabase);
  if (lessons.length === 0) return null;

  return getUnlockedLessonIds(lessons, progress.completedLessons);
}

export async function getLessonsForParcours(level: string, category: string, supabase: SupabaseClient = defaultSupabase): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, slug, title, order_index, level, category, duration, difficulty, objective, vocab_theme_categories')
    .eq('level', level)
    .eq('category', category)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching lessons for parcours:', error);
    return [];
  }

  return data || [];
}

export async function getLessonBySlug(slug: string, supabase: SupabaseClient = defaultSupabase): Promise<Lesson | null> {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, slug, title, order_index, level, category, duration, difficulty, objective, content')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching lesson by slug:', error);
    return null;
  }

  return data;
}

export async function getLessonById(id: string, supabase: SupabaseClient = defaultSupabase): Promise<Lesson | null> {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, slug, title, order_index, level, category, duration, difficulty, objective, content')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching lesson by id:', error);
    return null;
  }

  return data;
}

// getRecommendedExercises() a été retirée : remplacée par resolveNextExercises()
// dans src/lib/recommendation-resolver.ts (Phase 2/3 de la refonte du moteur
// de recommandation), qui ajoute les paliers SRS et contexte-leçon.
