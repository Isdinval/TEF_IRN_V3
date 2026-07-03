import { Metadata } from 'next';
import { createClient } from '@/lib/supabase-server';
import { siteUrl } from '@/lib/site';

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: lesson } = await supabase
    .from('lessons')
    .select('title, objective, level, category')
    .eq('id', id)
    .single();

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
      canonical: `/TEF_IRN/lessons/${id}`,
    },
    openGraph: {
      title: `${title} - Leçon TEF IRN | LlamaKusi`,
      description,
      type: 'article',
      url: `${siteUrl}/TEF_IRN/lessons/${id}`,
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
