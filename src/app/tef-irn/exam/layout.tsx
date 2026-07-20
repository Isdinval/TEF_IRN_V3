import { Metadata } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import { siteUrl } from "@/lib/site";

// Typographie propre à /exam : un empattement pour la gravité "document officiel"
// (Fraunces) et une monospace pour les codes de dossier / minuteurs (JetBrains Mono).
// Chargées ici plutôt que dans le layout racine pour ne pas affecter le reste du site.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--exam-font-display",
  weight: ["500", "600", "700", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--exam-font-mono",
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "Examen blanc TEF IRN chronométré | LlamaKusi",
  description:
    "Passez un examen blanc du TEF IRN dans les conditions réelles : épreuves chronométrées, correction immédiate et score détaillé pour évaluer votre niveau.",
  alternates: {
    canonical: "/tef-irn/exam",
  },
  openGraph: {
    title: "Examen blanc TEF IRN chronométré | LlamaKusi",
    description:
      "Simulez le TEF IRN dans les conditions réelles avec correction immédiate.",
    url: `${siteUrl}/tef-irn/exam`,
    type: "website",
  },
};

export default function ExamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${fraunces.variable} ${jetbrainsMono.variable} min-h-screen`}
      style={
        {
          // Identité "convocation / dossier officiel" : papier, bleu République, tampon.
          '--exam-ink': '#14213D',
          '--exam-blue': '#002654',
          '--exam-paper': '#F6F3EC',
          '--exam-paper-dark': '#EDE8DA',
          '--exam-seal': '#B23A2E',
          '--exam-line': '#D8D2C4',
          '--exam-success': '#2F6F4E',
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
