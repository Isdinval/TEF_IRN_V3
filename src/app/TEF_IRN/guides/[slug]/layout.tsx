import { Metadata } from 'next';
import { createClient } from '@/lib/supabase-server';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const supabase = await createClient();
  const { data: guide } = await supabase
    .from('guides')
    .select('title, description')
    .eq('slug', params.slug)
    .single();

  if (!guide) {
    return {
      title: 'Guide non trouvé - LlamaKusi',
    };
  }

  return {
    title: `${guide.title} | Guide TEF IRN - LlamaKusi`,
    description: guide.description,
    openGraph: {
      title: guide.title,
      description: guide.description || '',
      type: 'article',
    },
  };
}

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
