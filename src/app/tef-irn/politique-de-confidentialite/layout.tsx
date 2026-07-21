import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité - LlamaKusi",
  description:
    "Comment LlamaKusi collecte, utilise et protège vos données personnelles (compte, progression pédagogique, paiement) dans le cadre du RGPD.",
};

export default function PolitiqueConfidentialiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
