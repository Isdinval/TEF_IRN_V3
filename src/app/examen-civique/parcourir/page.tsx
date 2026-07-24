import { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { getCivicQuestions } from "@/lib/civic-questions";
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

  return (
    <>
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
