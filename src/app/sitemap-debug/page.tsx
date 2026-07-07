import { createClient } from '@/lib/supabase-server';

export default async function SitemapDebug() {
  const supabase = await createClient();

  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('slug, is_published')
    .limit(10);

  const { data: allLessonsCount } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true });

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace' }}>
      <h1>Debug Sitemap</h1>
      <p><strong>Total lessons dans la table :</strong> {allLessonsCount?.count || 0}</p>
      
      {lessonsError && <p style={{color:'red'}}>Erreur lessons: {lessonsError.message}</p>}
      
      <h2>10 premières leçons :</h2>
      <pre>{JSON.stringify(lessons, null, 2)}</pre>
    </div>
  );
}
