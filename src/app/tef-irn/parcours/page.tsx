import { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { getParcours, getParcoursOverviews } from "@/lib/parcours";
import ParcoursList, { ParcoursWithProgress } from "./ParcoursList";
import JsonLd from "@/components/shared/JsonLd";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Parcours d'Apprentissage TEF IRN - LlamaKusi",
  description: "Découvrez nos parcours structurés pour réussir le TEF IRN. Préparation complète aux niveaux A1, A2 et B1 avec un coach IA personnalisé. Progressez pas à pas vers votre certification.",
  keywords: ["TEF IRN", "préparation TEF", "examen français", "B1 français", "parcours apprentissage", "LlamaKusi"],
  alternates: {
    canonical: `${siteUrl}/tef-irn/parcours`,
  },
  openGraph: {
    title: "Parcours d'Apprentissage TEF IRN - LlamaKusi",
    description: "Programmes complets de préparation au TEF IRN : Grammaire, Vocabulaire, Compréhension et Expression.",
    url: `${siteUrl}/tef-irn/parcours`,
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

export default async function ParcoursPage() {
  const supabase = await createClient();

  // Fetch user session
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all parcours + leur progression (3 requêtes groupées, pas de N+1)
  const allParcours = await getParcours(supabase);
  const [overviews, profileResult] = await Promise.all([
    getParcoursOverviews(allParcours, user?.id ?? null, supabase),
    // Parcours actif = celui de la TopBar (ParcoursContext), source unique pour "Reprendre".
    user
      ? supabase.from('profiles').select('last_active_parcours_id').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const activeParcoursId = (profileResult.data as { last_active_parcours_id: string | null } | null)?.last_active_parcours_id ?? null;

  const parcoursWithProgress: ParcoursWithProgress[] = allParcours.map((p) => ({
    ...p,
    progress: user ? overviews[p.id]?.progress : undefined,
    lessonCount: overviews[p.id]?.progress.total ?? 0,
    nextLesson: overviews[p.id]?.nextLesson ?? null,
    exerciseStats: user ? overviews[p.id]?.exercises ?? null : null,
  }));

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
        "name": `${p.category} ${p.level}`,
        "description": p.objective,
        "provider": {
          "@type": "Organization",
          "name": "LlamaKusi",
          "url": siteUrl,
          "logo": `${siteUrl}/logo.png`
        },
        "url": `${siteUrl}/tef-irn/parcours/${p.slug}`,
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
        activeParcoursId={activeParcoursId}
      />
    </>
  );
}
