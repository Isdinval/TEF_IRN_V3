/**
 * page.tsx — Server Component.
 * Récupère les centres agréés depuis Supabase (données mises à jour manuellement
 * ~1x/mois, cf. pipeline scrape → enrich → import), injecte le JSON-LD et délègue
 * le rendu interactif (recherche + double vue Carte/Liste) à CivicCentres.
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

  const centresList = (centres ?? []) as Centre[];

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Examen civique", item: `${siteUrl}/examen-civique` },
      { "@type": "ListItem", position: 3, name: "Centres d'examen", item: `${siteUrl}/examen-civique/centres` },
    ],
  };

  // ItemList de LocalBusiness — un par centre agréé. C'est le contenu le plus
  // fort en potentiel GEO local du site (données géolocalisées réelles et
  // vérifiables) : très pertinent pour des requêtes "centre d'examen civique
  // près de [ville]" côté Google (rich results/Maps) comme côté moteurs
  // génératifs. Champs optionnels (téléphone, email, coordonnées) omis quand
  // absents plutôt que laissés vides, pour rester un JSON-LD valide.
  const localBusinessListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Centres d'examen civique agréés en France",
    numberOfItems: centresList.length,
    itemListElement: centresList.map((centre, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "LocalBusiness",
        "@id": `${siteUrl}/examen-civique/centres#centre-${centre.tc_id}`,
        name: centre.nom,
        address: {
          "@type": "PostalAddress",
          streetAddress: centre.adresse,
          ...(centre.code_postal ? { postalCode: centre.code_postal } : {}),
          ...(centre.ville ? { addressLocality: centre.ville } : {}),
          addressCountry: "FR",
        },
        ...(centre.latitude !== null && centre.longitude !== null
          ? {
              geo: {
                "@type": "GeoCoordinates",
                latitude: centre.latitude,
                longitude: centre.longitude,
              },
            }
          : {}),
        ...(centre.telephone ? { telephone: centre.telephone } : {}),
        ...(centre.email ? { email: centre.email } : {}),
        url: centre.url_contact,
      },
    })),
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} id="civic-centres-breadcrumb" />
      <JsonLd data={localBusinessListSchema} id="civic-centres-local-business" />
      <div className="sr-only">
        <p>
          Liste complète des centres agréés CCI pour passer l&apos;examen civique en France :
          naturalisation, carte de résident, carte de séjour pluriannuelle. Adresse, téléphone
          et email pour chaque centre.
        </p>
      </div>
      <CivicCentres initialCentres={centresList} />
    </>
  );
}
