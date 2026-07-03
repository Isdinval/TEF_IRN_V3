import { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { getParcours, getParcoursProgress, Parcours, ParcoursProgress } from "@/lib/parcours";
import ParcoursList from "./ParcoursList";
import JsonLd from "@/components/shared/JsonLd";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Parcours d'Apprentissage TEF IRN - LlamaKusi",
  description: "Découvrez nos parcours structurés pour réussir le TEF IRN. Préparation complète aux niveaux A1, A2 et B1 avec un coach IA personnalisé. Progressez pas à pas vers votre certification.",
  keywords: ["TEF IRN", "préparation TEF", "examen français", "B1 français", "parcours apprentissage", "LlamaKusi"],
  alternates: {
    canonical: `${siteUrl}/TEF_IRN/parcours`,
  },
  openGraph: {
    title: "Parcours d'Apprentissage TEF IRN - LlamaKusi",
    description: "Programmes complets de préparation au TEF IRN : Grammaire, Vocabulaire, Compréhension et Expression.",
    url: `${siteUrl}/TEF_IRN/parcours`,
    siteName: 'LlamaKusi',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-parcours.png`,
        width: 1200,
        height: 630,
        alt: 'Parcours LlamaKusi TEF IRN',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Parcours d'Apprentissage TEF IRN - LlamaKusi",
    description: "Préparez votre TEF IRN avec des parcours structurés et l'aide de notre IA.",
    images: [`${siteUrl}/og-parcours.png`],
  },
};

interface ParcoursWithProgress extends Parcours {
  progress?: ParcoursProgress;
}

export default async function ParcoursPage() {
  const supabase = await createClient();

  // Fetch user session
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all parcours
  const allParcours = await getParcours(supabase);

  let parcoursWithProgress: ParcoursWithProgress[] = [];

  if (user) {
    const progressPromises = allParcours.map(async (p) => {
      const prog = await getParcoursProgress(user.id, p.level, p.category, p.id, supabase);
      return { ...p, progress: prog };
    });
    parcoursWithProgress = await Promise.all(progressPromises);
  } else {
    parcoursWithProgress = allParcours.map(p => ({ ...p }));
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Parcours de préparation au TEF IRN",
    "description": "Liste complète des parcours d'apprentissage pour réussir l'examen TEF IRN par LlamaKusi.",
    "numberOfItems": allParcours.length,
    "itemListElement": allParcours.map((p, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Course",
        "name": p.nom_parcours || `Parcours ${p.category} ${p.level}`,
        "description": p.objective,
        "provider": {
          "@type": "Organization",
          "name": "LlamaKusi",
          "url": siteUrl,
          "logo": `${siteUrl}/logo.png`
        },
        "url": `${siteUrl}/TEF_IRN/parcours/${p.id}`,
        "educationalLevel": p.level,
        "about": {
          "@type": "Thing",
          "name": p.category
        }
      }
    }))
  };

  return (
    <>
      <JsonLd data={jsonLd} id="parcours-list-schema" />
      <ParcoursList
        allParcours={parcoursWithProgress}
        user={user}
      />
    </>
  );
}
