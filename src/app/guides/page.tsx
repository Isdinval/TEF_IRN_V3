import { createClient } from '@/lib/supabase-server';
import GuidesList from './GuidesList';

export default async function GuidesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('guides')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching guides:', error);
  }

  return <GuidesList initialGuides={data || []} />;
}
