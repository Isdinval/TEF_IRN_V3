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
  // 1. Fetch user progress from user_parcours_progress
  let userProgress = null;
  if (parcoursId) {
    const { data } = await supabase
      .from('user_parcours_progress')
      .select('status, started_at')
      .eq('user_id', userId)
      .eq('parcours_id', parcoursId)
      .single();
    userProgress = data;
  }

  // 2. Calculate lesson-based progress
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id')
    .eq('level', level)
    .eq('category', category);

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

export async function getRecommendedExercises(userId: string, level: string, category: string, supabase: SupabaseClient = defaultSupabase): Promise<Exercise[]> {
  // Try both capitalized and lower case for category matching in exercises table
  const exerciseCategory = category.charAt(0).toUpperCase() + category.slice(1);

  const { data: exercises, error: exercisesError } = await supabase
    .from('exercises')
    .select('id, lesson_id, type, level, instructions, category, difficulty')
    .eq('level', level)
    .or(`category.eq.${exerciseCategory},category.eq.${category}`)
    .limit(50);

  if (exercisesError || !exercises) return [];

  const exerciseIds = exercises.map((e: { id: string }) => e.id);

  const { data: attempts, error: attemptsError } = await supabase
    .from('exercise_attempts')
    .select('exercise_id, score, is_completed')
    .eq('user_id', userId)
    .in('exercise_id', exerciseIds);

  if (attemptsError) return exercises.slice(0, 6);

  const exerciseStats = (exercises as Exercise[]).map((ex: Exercise) => {
    const exAttempts = (attempts || []).filter((a: any) => a.exercise_id === ex.id);
    const completedAttempts = exAttempts.filter((a: any) => a.is_completed);
    const successRate = completedAttempts.length > 0
      ? Math.max(...completedAttempts.map((a: any) => a.score || 0))
      : 0;

    return {
      ...ex,
      success_rate: completedAttempts.length > 0 ? successRate : undefined,
      attempts_count: exAttempts.length,
      is_completed: completedAttempts.length > 0
    };
  });

  const recommended = exerciseStats.sort((a: any, b: any) => {
    // 1. Prioritize non-completed
    if (!a.is_completed && b.is_completed) return -1;
    if (a.is_completed && !b.is_completed) return 1;
    // 2. Prioritize low success rate
    return (a.success_rate || 0) - (b.success_rate || 0);
  });

  return recommended.slice(0, 6);
}
