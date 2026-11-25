import { Metadata } from 'next';
import { createClient } from '@/lib/supabase-server';
import { getParcoursBySlug, getParcoursById } from '@/lib/parcours';
import { siteUrl } from '@/lib/site';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params;
  const supabase = await createClient();

  let parcours = await getParcoursBySlug(slug, supabase);

  // Backward compatibility check for metadata
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!parcours && uuidRegex.test(slug)) {
    parcours = await getParcoursById(slug, supabase);
  }

  if (!parcours) {
    return {
      title: 'Parcours non trouvé - LlamaKusi',
    };
  }

  const title = `${parcours.nom_parcours || parcours.category + ' ' + parcours.level} - LlamaKusi TEF IRN`;
  // Un objectif de moins de 70 caractères est trop court pour une description : on le complète.
  const objective = parcours.objective?.trim();
  const description = !objective
    ? `Parcours d'apprentissage structuré pour maîtriser le ${parcours.category} au niveau ${parcours.level} pour l'examen TEF IRN.`
    : objective.length < 70
      ? `${objective} Parcours ${parcours.level} : leçons, exercices et coach IA LlamaKusi pour préparer le TEF IRN.`
      : objective;

  return {
    title,
    description: description.slice(0, 160),
    keywords: ["TEF IRN", "préparation TEF", parcours.category, parcours.level, "français B1", "cours de français"],
    alternates: {
      canonical: `${siteUrl}/tef-irn/parcours/${parcours.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/tef-irn/parcours/${parcours.slug}`,
      siteName: 'LlamaKusi',
      locale: 'fr_FR',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function ParcoursLayout(props: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { children } = props;
  return <>{children}</>;
}
