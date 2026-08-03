import { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { ExamProvider } from "@/contexts/ExamContext";

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
      className="min-h-screen"
      style={
        {
          // Tokens alignés sur le design system LlamaKusi (cf. globals.css).
          // Les noms de variables --exam-* sont conservés pour ne pas toucher aux
          // composants consommateurs (ExamSelector, QuestionCard, ResultsScreen, etc.) :
          // seule leur valeur change ici. Le reskin des formes/cartes est traité à part.
          '--exam-ink': '#18181B',       // zinc-900
          '--exam-blue': 'var(--brand-blue)',
          '--exam-paper': '#FAFAFA',     // brand-off-white
          '--exam-paper-dark': '#F4F4F5', // zinc-100
          '--exam-seal': '#E11D48',      // rose-600, cohérent avec les badges du dashboard
          '--exam-line': '#E4E4E7',      // zinc-200
          '--exam-success': '#059669',   // emerald-600
          '--exam-font-display': 'var(--font-montserrat), ui-sans-serif, system-ui',
          '--exam-font-mono': 'ui-monospace, SFMono-Regular, Menlo, monospace',
        } as React.CSSProperties
      }
    >
      <ExamProvider>{children}</ExamProvider>
    </div>
  );
}
