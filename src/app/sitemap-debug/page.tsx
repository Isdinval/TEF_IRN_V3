import { createClient } from '@/lib/supabase-server';

export default async function SitemapDebug() {
  const supabase = await createClient();

  // Count total lessons
  const { count: totalLessons, error: countError } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true });

  // Fetch some lessons
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('slug, is_published, created_at')
    .limit(20);

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace', lineHeight: '1.6' }}>
      <h1>🔍 Sitemap Debug Page</h1>
      
      <p><strong>Total lessons dans la table :</strong> {totalLessons || 0}</p>
      
      {countError && <p style={{ color: 'red' }}>Count Error: {countError.message}</p>}
      {lessonsError && <p style={{ color: 'red' }}>Lessons Error: {lessonsError.message}</p>}

      <h2>Exemples de leçons récupérées ({lessons?.length || 0}) :</h2>
      <pre style={{ background: '#f4f4f4', padding: '15px', overflow: 'auto' }}>
        {JSON.stringify(lessons, null, 2)}
      </pre>
    </div>
  );
}
