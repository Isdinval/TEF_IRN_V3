import { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { getCivicQuestions } from "@/lib/civic-questions";
import { DEFAULT_MENTION } from "@/lib/civic-constants";
import JsonLd from "@/components/shared/JsonLd";
import { CivicCatalogue } from "./CivicCatalogue";

export const metadata: Metadata = {
  title: "Toutes les questions de l'examen civique — Réponses & sources | LlamaKusi",
  description:
    "Parcourez l'ensemble des questions officielles de l'examen civique (naturalisation, carte de résident, carte de séjour pluriannuelle) avec réponse, explication et source. Filtrez par thématique.",
  alternates: {
    canonical: `${siteUrl}/examen-civique/parcourir`,
  },
};

export default async function ParcourirPage() {
  const questions = await getCivicQuestions();

  // Le schema doit refléter le contenu réellement visible par défaut (démarche "naturalisation",
  // toutes thématiques) — le filtre interactif change l'affichage mais pas cette version SEO.
  const defaultQuestions = questions.filter((q) => q.mentions.includes(DEFAULT_MENTION));
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: defaultQuestions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.explanation ? `${q.correct_answer} ${q.explanation}` : q.correct_answer,
      },
    })),
  };

  return (
    <>
      <JsonLd data={faqSchema} id="civic-parcourir-faq-schema" />
      <div className="sr-only">
        <p>
          Consultez gratuitement toutes les questions et réponses officielles de l'examen civique,
          classées par thématique, avec explication et source du Ministère de l'Intérieur.
        </p>
      </div>
      <CivicCatalogue initialQuestions={questions} />
    </>
  );
}
