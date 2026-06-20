import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import GuideDetail from './GuideDetail';

export default async function GuideDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const supabase = await createClient();

  const { data: guide, error } = await supabase
    .from('guides')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error || !guide) {
    notFound();
  }

  return <GuideDetail guide={guide} />;
}
