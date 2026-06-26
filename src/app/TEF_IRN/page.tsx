import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/sections/Hero";
import { ProblemSolution } from "@/components/landing/sections/ProblemSolution";
import { HowItWorks } from "@/components/landing/sections/HowItWorks";
import { Features } from "@/components/landing/sections/Features";
import { Testimonials } from "@/components/landing/sections/Testimonials";
import { Pricing } from "@/components/landing/sections/Pricing";
import { Merchandising } from "@/components/landing/sections/Merchandising";
import { Team } from "@/components/landing/sections/Team";
import { FAQ } from "@/components/landing/sections/FAQ";
import { FinalCTA } from "@/components/landing/sections/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-brand-dark overflow-x-hidden">
      <Header />
      <main className="flex-1">
        <Hero />
        <ProblemSolution />
        <Features />
        <Testimonials />
        <HowItWorks />
        <Pricing />
        <Team />
        <Merchandising />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
