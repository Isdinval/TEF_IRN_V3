import { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import JsonLd from "@/components/shared/JsonLd";
import { CivicEligibility } from "./CivicEligibility";

export const metadata: Metadata = {
  title: "Suis-je concerné par l'examen civique ? Test d'éligibilité | LlamaKusi",
  description:
    "Vérifiez en 3 questions si vous devez passer l'examen civique pour votre carte de séjour pluriannuelle, votre carte de résident ou votre naturalisation, et si vous pouvez en être dispensé.",
  alternates: {
    canonical: `${siteUrl}/examen-civique/eligibilite`,
  },
  openGraph: {
    title: "Suis-je concerné par l'examen civique ? Test d'éligibilité",
    description:
      "Répondez à 3 questions pour savoir si l'examen civique est obligatoire dans votre situation, ou si vous pouvez en être dispensé.",
    url: `${siteUrl}/examen-civique/eligibilite`,
    type: "website",
    // Pas d'`images` ici : géré automatiquement par src/app/opengraph-image.tsx
    // (convention Next.js). L'ancienne référence à /logo.png avait des
    // dimensions déclarées (1200x630) qui ne correspondaient pas au fichier
    // réel (322x331) — image déformée sur tout partage social.
  },
  keywords: [
    "suis-je concerné examen civique",
    "dispense examen civique",
    "examen civique obligatoire ou pas",
    "éligibilité examen civique 2026",
    "exemption examen civique naturalisation",
  ],
};

const faqItems = [
  {
    q: "Qui doit passer l'examen civique ?",
    a: "Depuis le 1er janvier 2026, toute personne effectuant une première demande de carte de séjour pluriannuelle (CSP), de carte de résident (CR) ou de naturalisation/réintégration par décret doit présenter une attestation de réussite à l'examen civique.",
  },
  {
    q: "Le mariage avec un(e) Français(e) dispense-t-il de l'examen civique ?",
    a: "Oui, si la nationalité est acquise par déclaration (mariage, ascendant ou frère/sœur d'un Français). L'examen civique ne concerne que l'acquisition par décret (naturalisation, réintégration), jamais les procédures par déclaration.",
  },
  {
    q: "Le renouvellement d'un titre de séjour est-il concerné ?",
    a: "Non. L'examen civique n'est exigé qu'une seule fois, au moment de la toute première obtention du titre. Un simple renouvellement d'un titre déjà détenu n'est jamais concerné.",
  },
  {
    q: "Qui peut être dispensé de l'examen civique ?",
    a: "Pour la CSP et la carte de résident : les personnes de 65 ans ou plus, et les situations médicales ou de handicap rendant l'évaluation impossible (sur certificat médical, au cas par cas). Pour la CSP uniquement, les bénéficiaires de la protection subsidiaire et les apatrides (avec leur famille) sont hors champ. Pour la naturalisation, seule la dispense médicale/handicap s'applique.",
  },
  {
    q: "Un réfugié doit-il passer l'examen civique pour une carte de résident ?",
    a: "Oui, dans le cas d'une carte de résident longue durée-UE : les bénéficiaires d'une carte de réfugié ou de protection subsidiaire y sont explicitement soumis, contrairement à la carte de séjour pluriannuelle où ce statut les place hors champ.",
  },
  {
    q: "Les accords bilatéraux (par exemple franco-algérien) dispensent-ils de l'examen ?",
    a: "Ce point fait l'objet d'interprétations divergentes selon les sources et les préfectures, et n'est pas tranché explicitement sur service-public.gouv.fr. Ne vous fiez pas à une dispense automatique : vérifiez votre situation exacte avant votre demande.",
  },
  {
    q: "Ce test d'éligibilité a-t-il une valeur officielle ?",
    a: "Non, ce test est un outil d'orientation qui couvre les cas les plus fréquents. Il ne remplace pas une vérification auprès de votre préfecture ou sur service-public.gouv.fr, seules autorités compétentes pour statuer sur votre situation personnelle.",
  },
];

export default function EligibilitePage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Examen civique", item: `${siteUrl}/examen-civique` },
      { "@type": "ListItem", position: 3, name: "Éligibilité", item: `${siteUrl}/examen-civique/eligibilite` },
    ],
  };

  return (
    <>
      <JsonLd data={faqSchema} id="civic-eligibilite-faq-schema" />
      <JsonLd data={breadcrumbSchema} id="civic-eligibilite-breadcrumb" />
      <CivicEligibility faqItems={faqItems} />
    </>
  );
}
