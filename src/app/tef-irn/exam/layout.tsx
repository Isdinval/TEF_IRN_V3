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
    <div className="min-h-screen">
      <ExamProvider>{children}</ExamProvider>
    </div>
  );
}
