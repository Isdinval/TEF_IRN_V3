import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import GuideDetail from './GuideDetail';
import JsonLd from '@/components/shared/JsonLd';
import { buildGuideSchemas } from '@/lib/guide-schema';

export default async function GuideDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const supabase = await createClient();

  const { data: guide, error } = await supabase
    .from('guides')
    .select(`*, key_points`)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  // Les guides examen civique vivent désormais sous /examen-civique/guides/[slug] —
  // ne jamais les servir en double ici (contenu dupliqué + CTA/liens pensés pour le TEF IRN).
  if (error || !guide || guide.product === 'examen-civique') {
    notFound();
  }

  const { article, breadcrumb } = buildGuideSchemas('tef-irn', slug, guide);

  return (
    <>
      <JsonLd data={article} id={`article-${slug}`} />
      <JsonLd data={breadcrumb} id={`guide-breadcrumb-${slug}`} />
      <GuideDetail guide={guide} />
    </>
  );
}
