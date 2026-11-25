import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import CivicGuideDetail from './CivicGuideDetail';
import JsonLd from '@/components/shared/JsonLd';
import { buildGuideSchemas } from '@/lib/guide-schema';

export default async function CivicGuideDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const supabase = await createClient();

  const { data: guide, error } = await supabase
    .from('guides')
    .select(`*, key_points`)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  // Un guide qui existe mais n'est pas de catégorie civique n'a rien à faire ici —
  // sa page canonique est /tef-irn/guides/[slug].
  if (error || !guide || guide.product !== 'examen-civique') {
    notFound();
  }

  const { article, breadcrumb } = buildGuideSchemas('examen-civique', slug, guide);

  return (
    <>
      <JsonLd data={article} id={`civic-article-${slug}`} />
      <JsonLd data={breadcrumb} id={`civic-guide-breadcrumb-${slug}`} />
      <CivicGuideDetail guide={guide} />
    </>
  );
}
