import { Metadata } from 'next';
import { createClient } from '@/lib/supabase-server';
import { getParcoursById } from '@/lib/parcours';

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params;
  const supabase = await createClient();
  const parcours = await getParcoursById(id, supabase);

  if (!parcours) {
    return {
      title: 'Parcours non trouvé - LlamaKusi',
    };
  }

  const title = `${parcours.nom_parcours || parcours.category + ' ' + parcours.level} - LlamaKusi TEF IRN`;
  const description = parcours.objective || `Parcours d'apprentissage structuré pour maîtriser le ${parcours.category} au niveau ${parcours.level} pour l'examen TEF IRN.`;

  return {
    title,
    description: description.slice(0, 160),
    keywords: ["TEF IRN", "préparation TEF", parcours.category, parcours.level, "français B1", "cours de français"],
    alternates: {
      canonical: `https://llamakusi.com/TEF_IRN/parcours/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `https://llamakusi.com/TEF_IRN/parcours/${id}`,
      siteName: 'LlamaKusi',
      locale: 'fr_FR',
      type: 'article',
      images: [
        {
          url: 'https://llamakusi.com/og-parcours.png',
          width: 1200,
          height: 630,
          alt: `Parcours ${parcours.category} ${parcours.level}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://llamakusi.com/og-parcours.png'],
    },
  };
}

export default async function ParcoursLayout(props: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { children } = props;
  return <>{children}</>;
}
