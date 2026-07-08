import { Metadata } from 'next';
import { createClient } from '@/lib/supabase-server';
import { siteUrl } from '@/lib/site';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const supabase = await createClient();
  const { data: guide } = await supabase
    .from('guides')
    .select('title, description, image_url, created_at, updated_at')
    .eq('slug', params.slug)
    .single();

  if (!guide) {
    return {
      title: 'Guide non trouvé',
    };
  }

  const url = `${siteUrl}/tef-irn/guides/${params.slug}`;
  const defaultImage = `${siteUrl}/og-image.png`;

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
      images: [
        {
          url: guide.image_url || defaultImage,
          width: 1200,
          height: 630,
          alt: guide.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.title,
      description: guide.description || '',
      images: [guide.image_url || defaultImage],
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
