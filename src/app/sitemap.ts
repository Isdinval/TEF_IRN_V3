import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase-server';
import { siteUrl } from '@/lib/site';
import {
  HERO_IMAGE_URL,
  OLIVIER_PHOTO_URL,
  GRECIA_PHOTO_URL,
  BANNER_IMAGE_URL,
  MASCOT_IMAGE_URL,
} from '@/data/notre-histoire-images';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const rootPath = `${siteUrl}/tef-irn`;

  // === LESSONS ===
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('slug, created_at');

  if (lessonsError) {
    console.error('Erreur sitemap lessons:', lessonsError);
  }

  // === GUIDES ===
  const { data: guides } = await supabase
    .from('guides')
    .select('slug, created_at, updated_at, image_url')
    .eq('is_published', true);

  // === PARCOURS ===
  const { data: parcours } = await supabase
    .from('parcours')
    .select('slug, created_at');

  const lessonUrls: MetadataRoute.Sitemap = (lessons || []).map((lesson: any) => ({
    url: `${rootPath}/lessons/${lesson.slug}`,
    lastModified: new Date(lesson.created_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  const guideUrls: MetadataRoute.Sitemap = (guides || []).map((guide: any) => ({
    url: `${rootPath}/guides/${guide.slug}`,
    lastModified: new Date(guide.updated_at || guide.created_at || new Date()),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
    ...(guide.image_url ? { images: [guide.image_url] } : {}),
  }));

  const parcoursUrls: MetadataRoute.Sitemap = (parcours || []).map((p: any) => ({
    url: `${rootPath}/parcours/${p.slug}`,
    lastModified: new Date(p.created_at || new Date()),
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }));

  const staticUrls: MetadataRoute.Sitemap = [
    { url: rootPath, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${rootPath}/lessons`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${rootPath}/guides`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${rootPath}/parcours`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.85 },
    {
      url: `${rootPath}/notre-histoire`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      images: [
        HERO_IMAGE_URL,
        OLIVIER_PHOTO_URL,
        GRECIA_PHOTO_URL,
        BANNER_IMAGE_URL,
        MASCOT_IMAGE_URL,
      ],
    },
    { url: `${rootPath}/conditions-utilisation`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${rootPath}/politique-de-confidentialite`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
    // mentions-legales volontairement absente : page en noindex tant que l'identité juridique n'est pas complétée
    { url: `${rootPath}/cookies`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: 0.3 },
  ];

  return [...staticUrls, ...lessonUrls, ...guideUrls, ...parcoursUrls];
}
