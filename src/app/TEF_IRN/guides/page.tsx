import { createClient } from '@/lib/supabase-server';
import GuidesList from './GuidesList';
import JsonLd from '@/components/shared/JsonLd';
import { siteUrl } from '@/lib/site';

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

  const guides = data || [];
  const guidesUrl = `${siteUrl}/TEF_IRN/guides`;

  // CollectionPage Schema
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

  return (
    <>
      <JsonLd data={collectionSchema} id="guides-collection-schema" />
      <GuidesList initialGuides={guides} />
    </>
  );
}
