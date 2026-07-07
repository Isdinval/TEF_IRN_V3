// src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase-server';
import { siteUrl } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const rootPath = `${siteUrl}/TEF_IRN`;

  // Lessons - contenu gratuit
  const { data: lessons } = await supabase
    .from('lessons')
    .select('slug, created_at, updated_at')
    .eq('is_published', true);   // ← Ajout crucial

  // Guides
  const { data: guides } = await supabase
    .from('guides')
    .select('slug, created_at, updated_at')
    .eq('is_published', true);

  // Parcours
  const { data: parcours } = await supabase
    .from('parcours')
    .select('slug, created_at');

  const lessonUrls = (lessons || []).map((lesson: any) => ({
    url: `${rootPath}/lessons/${lesson.slug}`,
    lastModified: new Date(lesson.updated_at || lesson.created_at || new Date()),
    changeFrequency: 'weekly' as const,     // Mieux pour du contenu éducatif
    priority: 0.85,
  }));

  const guideUrls = (guides || []).map((guide: any) => ({
    url: `${rootPath}/guides/${guide.slug}`,
    lastModified: new Date(guide.updated_at || guide.created_at || new Date()),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const parcoursUrls = (parcours || []).map((p: any) => ({
    url: `${rootPath}/parcours/${p.slug}`,
    lastModified: new Date(p.created_at || new Date()),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const staticUrls = [
    { url: rootPath, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1 },
    { url: `${rootPath}/lessons`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${rootPath}/guides`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${rootPath}/parcours`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
  ];

  return [...staticUrls, ...lessonUrls, ...guideUrls, ...parcoursUrls];
}
