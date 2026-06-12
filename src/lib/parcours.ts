import { createClient } from '@/lib/supabase';

const supabase = createClient();

export interface Parcours {
  id: string;
  level: string;
  category: string;
  objective: string;
}

export interface ParcoursProgress {
  total: number;
  completed: number;
  percent: number;
  isCompleted: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  order_index: number;
  level: string;
  category: string;
  duration?: number;
  difficulty?: 'facile' | 'moyen' | 'difficile';
  objective?: string;
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

export async function getParcours(): Promise<Parcours[]> {
  const { data, error } = await supabase
    .from('parcours')
    .select('*')
    .order('level', { ascending: true })
    .order('category', { ascending: true });

  if (error) {
    console.error('Error fetching parcours:', error);
    return [];
  }

  return data || [];
}

export async function getParcoursProgress(userId: string, level: string, category: string): Promise<ParcoursProgress> {
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id')
    .eq('level', level)
    .eq('category', category);

  if (lessonsError || !lessons) {
    return { total: 0, completed: 0, percent: 0, isCompleted: false };
  }

  const total = lessons.length;
  if (total === 0) return { total: 0, completed: 0, percent: 0, isCompleted: false };

  const lessonIds = lessons.map((l: { id: string }) => l.id);

  const { data: progress, error: progressError } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds);

  if (progressError) {
    return { total, completed: 0, percent: 0, isCompleted: false };
  }

  const completed = progress?.length || 0;
  const percent = Math.round((completed / total) * 100);
  const isCompleted = completed === total && total > 0;

  return { total, completed, percent, isCompleted };
}

export async function getParcoursById(id: string): Promise<Parcours | null> {
  const { data, error } = await supabase
    .from('parcours')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching parcours by id:', error);
    return null;
  }

  return data;
}

export async function getLessonsForParcours(level: string, category: string): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, title, order_index, level, category, duration, difficulty, objective')
    .eq('level', level)
    .eq('category', category)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching lessons for parcours:', error);
    return [];
  }

  return data || [];
}

export async function getRecommendedExercises(userId: string, level: string, category: string): Promise<Exercise[]> {
  // Map parcours category to exercise category (case sensitivity)
  const exerciseCategory = category.charAt(0).toUpperCase() + category.slice(1);

  // Fetch exercises for this parcours
  const { data: exercises, error: exercisesError } = await supabase
    .from('exercises')
    .select('id, lesson_id, type, level, instructions, category, difficulty')
    .eq('level', level)
    .eq('category', exerciseCategory)
    .limit(50);

  if (exercisesError || !exercises) return [];

  const exerciseIds = exercises.map((e: { id: string }) => e.id);

  // Fetch user attempts for these exercises
  const { data: attempts, error: attemptsError } = await supabase
    .from('exercise_attempts')
    .select('exercise_id, score, is_completed')
    .eq('user_id', userId)
    .in('exercise_id', exerciseIds);

  if (attemptsError) return exercises.slice(0, 6);

  // Calculate stats for each exercise
  const exerciseStats = exercises.map((ex: Exercise) => {
    const exAttempts = (attempts || []).filter((a: any) => a.exercise_id === ex.id);
    const completedAttempts = exAttempts.filter((a: any) => a.is_completed);
    const successRate = completedAttempts.length > 0
      ? Math.max(...completedAttempts.map((a: any) => a.score || 0))
      : 0;

    return {
      ...ex,
      success_rate: successRate,
      attempts_count: exAttempts.length,
      is_completed: completedAttempts.length > 0
    };
  });

  // Sorting logic:
  // 1. Not attempted or success rate < 70%
  // 2. Others
  const recommended = exerciseStats.sort((a: any, b: any) => {
    if (!a.is_completed && b.is_completed) return -1;
    if (a.is_completed && !b.is_completed) return 1;
    return (a.success_rate || 0) - (b.success_rate || 0);
  });

  return recommended.slice(0, 6);
}
