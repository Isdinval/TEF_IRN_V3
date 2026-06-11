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
  // Get all lessons for this parcours
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

  const lessonIds = lessons.map(l => l.id);

  // Get completed lessons for this user in this parcours
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
    .select('id, title, order_index, level, category')
    .eq('level', level)
    .eq('category', category)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching lessons for parcours:', error);
    return [];
  }

  return data || [];
}
