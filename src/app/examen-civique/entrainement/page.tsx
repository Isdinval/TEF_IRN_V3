import { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { CivicTraining } from "./CivicTraining";

export const metadata: Metadata = {
  title: "S'entraîner à l'examen civique — Apprendre & mémoriser | LlamaKusi",
  description:
    "Entraînez-vous gratuitement à l'examen civique : nouvelles questions expliquées puis testées immédiatement, et révisions programmées par un algorithme de mémorisation adaptative.",
  alternates: {
    canonical: `${siteUrl}/examen-civique/entrainement`,
  },
  robots: {
    // Page d'exercice interactive sans contenu propre à indexer (déjà couvert par le sommaire) —
    // évite un doublon de contenu avec /examen-civique et /examen-civique/parcourir.
    index: false,
    follow: true,
  },
};

export default function EntrainementPage() {
  return <CivicTraining />;
}
