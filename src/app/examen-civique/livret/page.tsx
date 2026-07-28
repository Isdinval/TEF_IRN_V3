import { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import JsonLd from "@/components/shared/JsonLd";
import LivretReader from "./LivretReader";

export const metadata: Metadata = {
  title: "Livret du citoyen 2026 — Lecture en ligne gratuite | LlamaKusi",
  description:
    "Lisez le Livret du citoyen 2026 (Ministère de l'Intérieur) en ligne, organisé par thème pour une préparation fluide à l'examen civique et à l'entretien de naturalisation. Téléchargement du PDF officiel inclus.",
  alternates: {
    canonical: `${siteUrl}/examen-civique/livret`,
  },
  openGraph: {
    title: "Livret du citoyen 2026 — Lecture en ligne gratuite",
    description:
      "Le Livret du citoyen 2026, réorganisé pour une lecture claire et fluide avant l'examen civique.",
    url: `${siteUrl}/examen-civique/livret`,
    type: "article",
  },
};

const OFFICIAL_SOURCE_URL =
  "https://www.immigration.interieur.gouv.fr/documentation/guides-textes-et-brochures/livret-du-citoyen.html";

export default function LivretCitoyenPage() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Livret du citoyen 2026",
    description:
      "Lecture en ligne, réorganisée par thème, du Livret du citoyen édité par le Ministère de l'Intérieur (édition mai 2026) : principes de la République, institutions, droits et devoirs, histoire, vie quotidienne.",
    url: `${siteUrl}/examen-civique/livret`,
    inLanguage: "fr-FR",
    datePublished: "2026-05-01",
    dateModified: "2026-07-01",
    isBasedOn: OFFICIAL_SOURCE_URL,
    about: "Examen civique et naturalisation française",
    publisher: { "@id": `${siteUrl}/#organization` },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Examen civique", item: `${siteUrl}/examen-civique` },
      { "@type": "ListItem", position: 3, name: "Livret du citoyen", item: `${siteUrl}/examen-civique/livret` },
    ],
  };

  return (
    <>
      <JsonLd data={articleSchema} id="civic-livret-article-schema" />
      <JsonLd data={breadcrumbSchema} id="civic-livret-breadcrumb" />
      <LivretReader />
    </>
  );
}
