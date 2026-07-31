import { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/sections/Hero";
import { ProblemSolution } from "@/components/landing/sections/ProblemSolution";
import { Features } from "@/components/landing/sections/Features";
import { Vocabulary } from "@/components/landing/sections/Vocabulary";
import { Testimonials } from "@/components/landing/sections/Testimonials";
import { Pricing } from "@/components/landing/sections/Pricing";
import { FAQ } from "@/components/landing/sections/FAQ";
import { FinalCTA } from "@/components/landing/sections/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "LlamaKusi - Coach IA pour l'Examen Civique et le TEF IRN",
  description:
    "Préparez votre naturalisation ou votre carte de résident avec LlamaKusi : entraînement gratuit à l'Examen Civique et coach IA pour les 4 épreuves du TEF IRN (écrit, oral, compréhension).",
  alternates: {
    canonical: "/tef-irn",
  },
  openGraph: {
    title: "LlamaKusi - Coach IA pour l'Examen Civique et le TEF IRN",
    description:
      "Votre coach IA personnel pour tout le parcours de naturalisation : Examen Civique (gratuit) et TEF IRN.",
    url: `${siteUrl}/tef-irn`,
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-brand-dark overflow-x-hidden">
      <Header />
      <main className="flex-1">
        <Hero />
        <ProblemSolution />
        <Features />
        <Vocabulary />
        <Testimonials />
        <Pricing />
        <FAQ />
        {/* Merchandising retirée : produits dérivés + waitlist supprimés */}
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
