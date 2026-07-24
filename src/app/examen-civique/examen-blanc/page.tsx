import { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { CivicExam } from "./CivicExam";

export const metadata: Metadata = {
  title: "Examen blanc civique — 40 questions, conditions réelles | LlamaKusi",
  description:
    "Passez un examen blanc gratuit de l'examen civique : 40 questions officielles, 45 minutes, conditions réelles. Résultat détaillé par thématique.",
  alternates: {
    canonical: `${siteUrl}/examen-civique/examen-blanc`,
  },
  robots: {
    // Page d'exercice interactive sans contenu propre à indexer (déjà couvert par le sommaire).
    index: false,
    follow: true,
  },
};

export default function ExamenBlancPage() {
  return <CivicExam />;
}
