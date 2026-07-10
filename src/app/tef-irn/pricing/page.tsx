import { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { Header } from "@/components/landing/Header";
import { Pricing } from "@/components/landing/sections/Pricing";
import { FAQ } from "@/components/landing/sections/FAQ";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Tarifs et abonnements | LlamaKusi",
  description:
    "Découvrez nos formules d'abonnement pour préparer le TEF IRN : accès aux exercices illimités, coach IA, simulateurs d'examen. Comparez nos offres et choisissez la vôtre.",
  alternates: {
    canonical: "/tef-irn/pricing",
  },
  openGraph: {
    title: "Tarifs et abonnements | LlamaKusi",
    description:
      "Comparez nos formules d'abonnement pour réussir le TEF IRN avec LlamaKusi.",
    url: `${siteUrl}/tef-irn/pricing`,
    type: "website",
  },
};

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-brand-dark">
      <Header />
      <main className="flex-1 pt-20">
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
