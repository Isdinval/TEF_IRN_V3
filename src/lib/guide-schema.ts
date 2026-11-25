import { siteUrl } from '@/lib/site';

export type GuideProduct = 'tef-irn' | 'examen-civique';

interface GuideForSchema {
  title: string;
  description?: string | null;
  image_url?: string | null;
  category?: string | null;
  created_at: string;
  updated_at?: string | null;
}

const PRODUCTS: Record<GuideProduct, { name: string; basePath: string; section: string; keyword: string[] }> = {
  'tef-irn': {
    name: 'TEF IRN',
    basePath: '/tef-irn',
    section: 'Guides TEF IRN',
    keyword: ['TEF IRN', 'préparation examen français'],
  },
  'examen-civique': {
    name: 'Examen civique',
    basePath: '/examen-civique',
    section: 'Guides examen civique',
    keyword: ['examen civique'],
  },
};

/** URL d'image absolue : en base, image_url est déjà absolue (Supabase Storage) et peut porter des espaces/retours à la ligne. */
function absoluteImageUrl(imageUrl: string | null | undefined, fallback: string): string {
  const raw = imageUrl?.trim();
  if (!raw) return fallback;
  return /^https?:\/\//i.test(raw) ? raw : `${siteUrl}${raw}`;
}

/** Schémas JSON-LD (Article + BreadcrumbList) communs à tous les guides publics. */
export function buildGuideSchemas(product: GuideProduct, slug: string, guide: GuideForSchema) {
  const cfg = PRODUCTS[product];
  const url = `${siteUrl}${cfg.basePath}/guides/${slug}`;
  // Une catégorie contenant un tiret est un identifiant interne (ex. "examen-civique-general"), pas un mot-clé.
  const category = guide.category && !guide.category.includes('-') ? guide.category : null;

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": guide.title,
    "description": guide.description,
    // Repli : l'image de partage générée du guide (opengraph-image.tsx).
    "image": absoluteImageUrl(guide.image_url, `${url}/opengraph-image`),
    "inLanguage": "fr",
    "datePublished": guide.created_at,
    "dateModified": guide.updated_at || guide.created_at,
    "author": { "@type": "Organization", "name": "LlamaKusi", "url": siteUrl },
    "publisher": {
      "@type": "Organization",
      "name": "LlamaKusi",
      "url": siteUrl,
      "logo": { "@type": "ImageObject", "url": `${siteUrl}/logo.png` },
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": url },
    "keywords": [...cfg.keyword, category].filter(Boolean),
    "articleSection": cfg.section,
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl },
      { "@type": "ListItem", position: 2, name: cfg.name, item: `${siteUrl}${cfg.basePath}` },
      { "@type": "ListItem", position: 3, name: "Guides", item: `${siteUrl}${cfg.basePath}/guides` },
      { "@type": "ListItem", position: 4, name: guide.title, item: url },
    ],
  };

  return { article, breadcrumb };
}
