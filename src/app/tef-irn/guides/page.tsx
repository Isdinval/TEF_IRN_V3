import { createClient } from '@/lib/supabase-server';
import GuidesList from './GuidesList';
import JsonLd from '@/components/shared/JsonLd';
import { siteUrl } from '@/lib/site';
import { CIVIC_GUIDE_CATEGORIES } from '@/lib/civic-guide-categories';

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

  // Les guides examen civique ont leur propre catalogue (/examen-civique/guides) —
  // ne pas les dupliquer ici, avec des liens et CTA pensés pour le TEF IRN.
  const guides = (data || []).filter(
    (g) => !(CIVIC_GUIDE_CATEGORIES as readonly string[]).includes(g.category)
  );
  const guidesUrl = `${siteUrl}/tef-irn/guides`;

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Guides et Ressources TEF IRN - LlamaKusi",
    "description": "Retrouvez tous nos guides gratuits pour réussir votre examen TEF IRN : méthodologie, exercices, vocabulaire et grammaire.",
    "url": guidesUrl,
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": guides.map((guide, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `${guidesUrl}/${guide.slug}`,
        "name": guide.title
      }))
    }
  };

  // Optionnel : BreadcrumbList pour la liste
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
        "item": guidesUrl
      }
    ]
  };

  return (
    <>
      <JsonLd data={collectionSchema} id="guides-collection-schema" />
      <JsonLd data={breadcrumbSchema} id="guides-breadcrumb" />
      <GuidesList initialGuides={guides} />
    </>
  );
}
