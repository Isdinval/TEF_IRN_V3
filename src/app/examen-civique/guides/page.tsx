import { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { getCivicGuides } from "@/lib/civic-guides";
import JsonLd from "@/components/shared/JsonLd";
import { CivicGuideCatalogue } from "./CivicGuideCatalogue";

export const metadata: Metadata = {
  title: "Guides examen civique — Naturalisation, CSP, CR | LlamaKusi",
  description:
    "Tous nos guides gratuits pour comprendre et réussir l'examen civique : naturalisation, carte de séjour pluriannuelle (CSP), carte de résident (CR).",
  alternates: {
    canonical: `${siteUrl}/examen-civique/guides`,
  },
};

export default async function CivicGuidesPage() {
  const guides = await getCivicGuides();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Examen civique", item: `${siteUrl}/examen-civique` },
      { "@type": "ListItem", position: 3, name: "Guides", item: `${siteUrl}/examen-civique/guides` },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} id="civic-guides-breadcrumb" />
      <CivicGuideCatalogue guides={guides} />
    </>
  );
}
