import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase-server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const baseUrl = 'https://tef-irn-v3.vercel.app/TEF_IRN';

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, created_at, updated_at');

  const { data: guides } = await supabase
    .from('guides')
    .select('slug, created_at, updated_at')
    .eq('is_published', true);

  const { data: parcours } = await supabase
    .from('parcours')
    .select('id, created_at');

  const lessonUrls = (lessons || []).map((lesson: any) => ({
    url: `${baseUrl}/TEF_IRN/lessons/${lesson.id}`,
    lastModified: new Date(lesson.updated_at || lesson.created_at),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const guideUrls = (guides || []).map((guide: any) => ({
    url: `${baseUrl}/guides/${guide.slug}`,
    lastModified: new Date(guide.updated_at || guide.created_at),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const parcoursUrls = (parcours || []).map((p: any) => ({
    url: `${baseUrl}/TEF_IRN/parcours/${p.id}`,
    lastModified: new Date(p.created_at),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const staticUrls = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/lessons`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/parcours`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
  ];

  return [...staticUrls, ...lessonUrls, ...guideUrls, ...parcoursUrls];
}
