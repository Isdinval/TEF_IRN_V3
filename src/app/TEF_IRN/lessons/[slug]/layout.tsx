import { Metadata } from 'next';
import { createClient } from '@/lib/supabase-server';
import { siteUrl } from '@/lib/site';
import { getLessonBySlug, getLessonById } from '@/lib/parcours';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params;
  const supabase = await createClient();

  let lesson = await getLessonBySlug(slug, supabase);

  // Backward compatibility check for metadata
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!lesson && uuidRegex.test(slug)) {
    lesson = await getLessonById(slug, supabase);
  }

  if (!lesson) {
    return { title: 'Leçon non trouvée' };
  }

  const title = `${lesson.title} (${lesson.level})`;
  const description = lesson.objective || `Apprenez ${lesson.title} pour réussir votre examen TEF IRN. Leçon interactive niveau ${lesson.level}.`;

  return {
    title,
    description: description.slice(0, 160),
    keywords: [
      `Leçon ${lesson.title}`,
      `TEF IRN ${lesson.category}`,
      `Français niveau ${lesson.level}`,
      "Préparation TEF IRN",
      "Examen de français nationalité",
      "LlamaKusi leçons",
      lesson.category
    ],
    alternates: {
      canonical: `/TEF_IRN/lessons/${lesson.slug}`,
    },
    openGraph: {
      title: `${title} - Leçon TEF IRN | LlamaKusi`,
      description,
      type: 'article',
      url: `${siteUrl}/TEF_IRN/lessons/${lesson.slug}`,
      siteName: 'LlamaKusi',
      images: [
        {
          url: '/logo.png',
          width: 1200,
          height: 630,
          alt: `Leçon LlamaKusi: ${lesson.title}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} - Leçon TEF IRN | LlamaKusi`,
      description,
      images: ['/logo.png'],
    },
  };
}

export default function LessonLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
