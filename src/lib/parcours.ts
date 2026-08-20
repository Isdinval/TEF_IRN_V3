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
  success_rate?: number;
  attempts_count?: number;
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
          .single()
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

export async function getLessonsForParcours(level: string, category: string, supabase: SupabaseClient = defaultSupabase): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, slug, title, order_index, level, category, duration, difficulty, objective')
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
