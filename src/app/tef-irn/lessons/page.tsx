import { createClient } from '@/lib/supabase-server';
import LessonsList from './LessonsList';
import { Metadata } from 'next';
import { siteUrl } from '@/lib/site';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Catalogue des Leçons TEF IRN - Grammaire, Vocabulaire, Expression',
  description: 'Progressez avec nos leçons structurées pour le TEF IRN. Plus de 120 leçons interactives couvrant tous les niveaux (A2-B1) et toutes les compétences de l\'examen.',
  alternates: {
    canonical: '/tef-irn/lessons',
  },
  openGraph: {
    title: 'Catalogue des Leçons TEF IRN - LlamaKusi',
    description: 'Toutes les leçons indispensables pour réussir le TEF IRN.',
    url: `${siteUrl}/tef-irn/lessons`,
    type: 'website',
  }
};

export default async function LessonsPage() {
  const supabase = await createClient();

  // 1. Fetch user to get progress
  const { data: { user } } = await supabase.auth.getUser();

  let completedIds = new Set<string>();
  if (user) {
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', user.id);

    if (progress) {
      completedIds = new Set(progress.map((p: any) => p.lesson_id));
    }
  }

  // 2. Fetch all lessons
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, slug, title, level, category, order_index, objective')
    .order('level', { ascending: true })
    .order('order_index', { ascending: true });

  const lessonsData = lessons || [];

  // 3. Structured Data
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": lessonsData.map((lesson, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `${siteUrl}/tef-irn/lessons/${lesson.slug}`,
      "name": lesson.title
    }))
  };

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
        "name": "Leçons",
        "item": `${siteUrl}/tef-irn/lessons`
      }
    ]
  };

  return (
    <>
      <Script
        id="lessons-list-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <Script
        id="lessons-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <LessonsList
        lessons={lessonsData}
        completedLessonIds={completedIds}
      />
    </>
  );
}
