import { Metadata } from 'next';
import { createClient } from '@/lib/supabase-server';

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: lesson } = await supabase
    .from('lessons')
    .select('title, objective')
    .eq('id', id)
    .single();

  if (!lesson) {
    return { title: 'Leçon non trouvée - Maitris' };
  }

  return {
    title: `${lesson.title} - Maitris TEF IRN`,
    description: lesson.objective?.slice(0, 160),
    openGraph: {
      title: lesson.title,
      description: lesson.objective || '',
      type: 'article',
    },
  };
}

export default function LessonLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
