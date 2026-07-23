import { Metadata } from "next";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Questions Examen Civique 2026 — Entraînement Gratuit | LlamaKusi",
  description:
    "Préparez l'examen civique pour votre naturalisation, carte de résident ou CSP. Questions officielles du Ministère de l'Intérieur, révision adaptative et examens blancs gratuits.",
  alternates: {
    canonical: `${siteUrl}/examen-civique`,
  },
  openGraph: {
    title: "Questions Examen Civique 2026 — Entraînement Gratuit",
    description:
      "Entraînez-vous gratuitement avec les questions officielles de l'examen civique (naturalisation, carte de résident, CSP). Examens blancs chronométrés inclus.",
    url: `${siteUrl}/examen-civique`,
    type: "website",
    images: [
      {
        url: `${siteUrl}/logo.png`,
        width: 1200,
        height: 630,
        alt: "LlamaKusi — Examen Civique Gratuit",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Questions Examen Civique 2026 — Entraînement Gratuit",
    description:
      "Questions officielles du Ministère de l'Intérieur. Entraînement gratuit, sans inscription.",
    images: [`${siteUrl}/logo.png`],
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
