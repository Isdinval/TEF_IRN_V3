import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import CivicGuideDetail from './CivicGuideDetail';
import JsonLd from '@/components/shared/JsonLd';
import { siteUrl } from '@/lib/site';
import { CIVIC_GUIDE_CATEGORIES } from '@/lib/civic-guide-categories';

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
  if (error || !guide || !(CIVIC_GUIDE_CATEGORIES as readonly string[]).includes(guide.category)) {
    notFound();
  }

  const url = `${siteUrl}/examen-civique/guides/${slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
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
      "@id": url
    },
    "keywords": ["examen civique", guide.category, guide.type].filter(Boolean),
    "articleSection": guide.type || "Guide examen civique"
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Examen civique", item: `${siteUrl}/examen-civique` },
      { "@type": "ListItem", position: 3, name: "Guides", item: `${siteUrl}/examen-civique/guides` },
      { "@type": "ListItem", position: 4, name: guide.title, item: url },
    ],
  };

  return (
    <>
      <JsonLd data={articleSchema} id={`civic-article-${slug}`} />
      <JsonLd data={breadcrumbSchema} id={`civic-guide-breadcrumb-${slug}`} />
      <CivicGuideDetail guide={guide} />
    </>
  );
}
