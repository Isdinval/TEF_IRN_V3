import { Metadata } from "next";
import { siteUrl } from "@/lib/site";
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

export default function LivretCitoyenPage() {
  return <LivretReader />;
}
