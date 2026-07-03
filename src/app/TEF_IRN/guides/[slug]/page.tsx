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

  const guideUrl = `${siteUrl}/TEF_IRN/guides/${guide.slug}`;

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Accueil",
        "item": siteUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Guides TEF IRN",
        "item": `${siteUrl}/TEF_IRN/guides`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": guide.title,
        "item": guideUrl
      }
    ]
  };

  // BlogPosting Schema
  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": guide.title,
    "description": guide.description,
    "image": guide.image_url || `${siteUrl}/og-image.png`,
    "author": {
      "@type": "Organization",
      "name": "LlamaKusi",
      "url": siteUrl
    },
    "publisher": {
      "@type": "Organization",
      "name": "LlamaKusi",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo.png`
      }
    },
    "datePublished": guide.created_at,
    "dateModified": guide.updated_at || guide.created_at,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": guideUrl
    }
  };

  // FAQ Schema detection logic
  // Look for "Q:" and "A:" or Question/Answer patterns in content
  const faqSchema: any = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": []
  };

  if (guide.content) {
    // Basic regex to find questions (e.g., "### Q: ..." followed by text)
    const qaPairs = guide.content.matchAll(/### (?:Q: )?(.*?)\n\n(.*?)(?=\n\n###|$)/gs);
    for (const match of qaPairs) {
      if (match[1] && match[2]) {
        faqSchema.mainEntity.push({
          "@type": "Question",
          "name": match[1].trim(),
          "acceptedAnswer": {
            "@type": "Answer",
            "text": match[2].trim()
          }
        });
      }
    }
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema} id="breadcrumb-schema" />
      <JsonLd data={blogPostingSchema} id="blog-posting-schema" />
      {faqSchema.mainEntity.length > 0 && (
        <JsonLd data={faqSchema} id="faq-schema" />
      )}
      <GuideDetail guide={guide} />
    </>
  );
}
