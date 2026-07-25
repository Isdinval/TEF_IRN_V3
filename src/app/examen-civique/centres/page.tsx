/**
 * page.tsx — Server Component.
 * Récupère les centres agréés depuis Supabase (données mises à jour manuellement
 * ~1x/mois, cf. pipeline scrape → enrich → import), injecte le JSON-LD et délègue
 * le rendu interactif (recherche) à CivicCentres.
 *
 * V1 : liste/cartes uniquement, pas de carte interactive (react-leaflet pas encore
 * en dépendance — voir CentresMap.tsx dans une itération future pour la V2).
 */
import { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { siteUrl } from "@/lib/site";
import JsonLd from "@/components/shared/JsonLd";
import { CivicCentres } from "./CivicCentres";
import type { Centre } from "./types";

// Donnée réimportée manuellement ~1x/mois : pas besoin de revalider plus souvent.
export const revalidate = 2592000; // 30 jours

export const metadata: Metadata = {
  title: "Centres d'examen civique agréés en France | LlamaKusi",
  description:
    "Trouvez le centre d'examen civique agréé CCI le plus proche de chez vous : adresse, " +
    "contact et localisation pour votre naturalisation, carte de résident ou carte de séjour pluriannuelle.",
  alternates: {
    canonical: `${siteUrl}/examen-civique/centres`,
  },
  openGraph: {
    title: "Centres d'examen civique agréés en France",
    description:
      "Liste des centres agréés CCI pour passer l'examen civique (naturalisation, carte de résident, carte de séjour pluriannuelle).",
    url: `${siteUrl}/examen-civique/centres`,
    type: "website",
  },
};

export default async function CentresPage() {
  const supabase = await createClient();

  const { data: centres, error } = await supabase
    .from("centres_examen_civique")
    .select("*")
    .eq("actif", true)
    .order("ville", { ascending: true });

  if (error) {
    console.error("Erreur chargement centres_examen_civique:", error);
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Examen civique", item: `${siteUrl}/examen-civique` },
      { "@type": "ListItem", position: 3, name: "Centres d'examen", item: `${siteUrl}/examen-civique/centres` },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} id="civic-centres-breadcrumb" />
      <div className="sr-only">
        <p>
          Liste complète des centres agréés CCI pour passer l&apos;examen civique en France :
          naturalisation, carte de résident, carte de séjour pluriannuelle. Adresse, téléphone
          et email pour chaque centre.
        </p>
      </div>
      <CivicCentres initialCentres={(centres ?? []) as Centre[]} />
    </>
  );
}
