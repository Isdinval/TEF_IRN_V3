import { Metadata } from "next";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Politique de confidentialité - LlamaKusi",
  description:
    "Comment LlamaKusi collecte, utilise et protège vos données personnelles (compte, progression pédagogique, paiement) dans le cadre du RGPD.",
  alternates: { canonical: `${siteUrl}/tef-irn/politique-de-confidentialite` },
};

export default function PolitiqueConfidentialiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
