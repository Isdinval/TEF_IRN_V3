import { Metadata } from 'next';
import { createClient } from '@/lib/supabase-server';
import { getParcoursById } from '@/lib/TEF_IRN/parcours';

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params;
  const supabase = await createClient();
  const parcours = await getParcoursById(id, supabase);

  if (!parcours) {
    return {
      title: 'Parcours non trouvé - LlamaKusi',
    };
  }

  return {
    title: `${parcours.category} ${parcours.level} - LlamaKusi TEF IRN`,
    description: parcours.objective,
  };
}

export default function ParcoursLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
