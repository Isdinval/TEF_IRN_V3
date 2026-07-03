import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import GuideDetail from './GuideDetail';
import JsonLd from '@/components/shared/JsonLd';
import { siteUrl } from '@/lib/site';

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

  // Schema Article / BlogPosting (standard 2026)
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting", // Ou "Article" si evergreen
    "headline": guide.title,
    "description": guide.description,
    "image": guide.image_url ? `${siteUrl}${guide.image_url}` : `${siteUrl}/og-image.png`,
    "datePublished": guide.created_at,
    "dateModified": guide.updated_at || guide.created_at,
    "author": {
      "@type": "Organization",
      "name": "LlamaKusi",
      "url": siteUrl
    },
    "publisher": {
      "@type": "Organization",
      "name": "LlamaKusi",
      "url": siteUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo.png`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${siteUrl}/TEF_IRN/guides/${slug}`
    },
    "keywords": ["TEF IRN", guide.category, guide.type, "préparation examen français"].filter(Boolean),
    "articleSection": guide.type || "Guide TEF IRN"
  };

  return (
    <>
      <JsonLd data={articleSchema} id={`article-${slug}`} />
      <GuideDetail guide={guide} />
    </>
  );
}
