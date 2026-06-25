import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import LessonInteractive from './LessonInteractive';

export default async function LessonPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const supabase = await createClient();

  // Fetch lesson data
  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .single();

  if (!lesson) {
    notFound();
  }

  // Fetch exercise data
  const { data: exercise } = await supabase
    .from('exercises')
    .select('*')
    .eq('lesson_id', id)
    .eq('type', 'qcm')
    .limit(1)
    .maybeSingle();

  // Fetch user session
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Course',
            name: lesson.title,
            description: lesson.objective,
            educationalLevel: lesson.level,
            provider: {
              '@type': 'Organization',
              name: 'LlamaKusi',
            },
          }),
        }}
      />
      <LessonInteractive
        lesson={lesson}
        exercise={exercise}
        initialUser={user}
      />
    </>
  );
}
