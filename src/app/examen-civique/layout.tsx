import { Metadata } from "next";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Questions Examen Civique 2026 — Entraînement Gratuit | LlamaKusi",
  description:
    "Préparez l'examen civique pour votre naturalisation, carte de résident ou carte de séjour pluriannuelle. Questions officielles du Ministère de l'Intérieur, révision adaptative et examens blancs gratuits.",
  alternates: {
    canonical: `${siteUrl}/examen-civique`,
  },
  openGraph: {
    title: "Questions Examen Civique 2026 — Entraînement Gratuit",
    description:
      "Entraînez-vous gratuitement avec les questions officielles de l'examen civique (naturalisation, carte de résident, carte de séjour pluriannuelle). Examens blancs chronométrés inclus.",
    url: `${siteUrl}/examen-civique`,
    type: "website",
    // Pas d'`images` ici : géré automatiquement par src/app/opengraph-image.tsx
    // (convention Next.js). L'ancienne référence à /logo.png avait des
    // dimensions déclarées (1200x630) qui ne correspondaient pas au fichier
    // réel (322x331) — image déformée sur tout partage social.
  },
  twitter: {
    card: "summary_large_image",
    title: "Questions Examen Civique 2026 — Entraînement Gratuit",
    description:
      "Questions officielles du Ministère de l'Intérieur. Entraînement gratuit, sans inscription.",
  },
  keywords: [
    "examen civique naturalisation",
    "questions examen civique 2026",
    "test civique naturalisation France",
    "quiz examen civique",
    "révision examen civique",
    "questions naturalisation France",
    "examen civique carte de résident",
    "préparation examen civique gratuit",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
    },
  },
};

export default function ExamenCiviqueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
