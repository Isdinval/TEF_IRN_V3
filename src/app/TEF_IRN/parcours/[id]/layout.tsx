import { Metadata } from 'next';
import { createClient } from '@/lib/supabase-server';
import { getParcoursById, getLessonsForParcours } from '@/lib/parcours';

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
  const { id } = await props.params;
  const supabase = await createClient();
  const parcours = await getParcoursById(id, supabase);

  if (!parcours) return children;

  const lessons = await getLessonsForParcours(parcours.level, parcours.category, supabase);

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": parcours.nom_parcours || `Parcours ${parcours.category} ${parcours.level}`,
    "description": parcours.objective,
    "provider": {
      "@type": "Organization",
      "name": "LlamaKusi",
      "sameAs": "https://llamakusi.com"
    },
    "url": `https://llamakusi.com/TEF_IRN/parcours/${id}`,
    "educationalLevel": parcours.level,
    "hasPart": lessons.map((lesson) => ({
      "@type": "Course",
      "name": lesson.title,
      "description": lesson.objective || `Leçon sur ${lesson.title}`,
      "url": `https://llamakusi.com/TEF_IRN/lessons/${lesson.id}`
    }))
  };

  const programJsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalProgram",
    "name": parcours.nom_parcours || `Programme ${parcours.category} ${parcours.level}`,
    "description": parcours.objective,
    "provider": {
      "@type": "Organization",
      "name": "LlamaKusi"
    },
    "educationalCredentialAwarded": "Attestation de réussite interne LlamaKusi",
    "programPrerequisites": `Connaissance de base en français niveau ${parcours.level === 'B1' ? 'A2' : 'A1'}`,
    "occupationalCategory": "Language Learning"
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Accueil",
        "item": "https://llamakusi.com/TEF_IRN"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Parcours",
        "item": "https://llamakusi.com/TEF_IRN/parcours"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": parcours.nom_parcours || `${parcours.category} ${parcours.level}`,
        "item": `https://llamakusi.com/TEF_IRN/parcours/${id}`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(programJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
