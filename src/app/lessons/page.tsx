import { createClient } from '@/lib/supabase-server';
import LessonsList from './LessonsList';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catalogue des Leçons TEF IRN - Maitris',
  description: 'Découvrez toutes nos leçons interactives pour réussir votre examen TEF IRN : compréhension, expression, grammaire et vocabulaire.',
};

export default async function LessonsPage() {
  const supabase = await createClient();

  // 1. Fetch user to get progress
  const { data: { user } } = await supabase.auth.getUser();

  let completedIds = new Set<string>();
  if (user) {
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', user.id);

    if (progress) {
      completedIds = new Set(progress.map((p: any) => p.lesson_id));
    }
  }

  // 2. Fetch all lessons
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, level, category, order_index')
    .order('level', { ascending: true })
    .order('order_index', { ascending: true });

  return (
    <LessonsList
      lessons={lessons || []}
      completedLessonIds={completedIds}
    />
  );
}
