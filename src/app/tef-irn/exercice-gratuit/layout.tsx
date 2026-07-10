import { Metadata } from "next";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Exercice gratuit TEF IRN | LlamaKusi",
  description:
    "Testez gratuitement notre méthode : un exercice interactif de compréhension écrite pour évaluer votre niveau de français avant de vous lancer dans le TEF IRN.",
  alternates: {
    canonical: "/tef-irn/exercice-gratuit",
  },
  openGraph: {
    title: "Exercice gratuit TEF IRN | LlamaKusi",
    description:
      "Un exercice interactif gratuit pour évaluer votre niveau avant le TEF IRN.",
    url: `${siteUrl}/tef-irn/exercice-gratuit`,
    type: "website",
  },
};

export default function ExerciceGratuitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
