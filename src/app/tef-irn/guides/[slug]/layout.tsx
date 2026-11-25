import { Metadata } from 'next';
import { createClient } from '@/lib/supabase-server';
import { siteUrl } from '@/lib/site';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const supabase = await createClient();
  const { data: guide } = await supabase
    .from('guides')
    .select('title, description, created_at, updated_at, product')
    .eq('slug', params.slug)
    .single();

  if (!guide || guide.product === 'examen-civique') {
    return {
      title: 'Guide non trouvé',
    };
  }

  const url = `${siteUrl}/tef-irn/guides/${params.slug}`;

  return {
    title: guide.title,
    description: guide.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: guide.title,
      description: guide.description || '',
      url: url,
      type: 'article',
      publishedTime: guide.created_at,
      modifiedTime: guide.updated_at || guide.created_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.title,
      description: guide.description || '',
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  };
}

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
