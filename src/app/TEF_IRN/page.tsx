import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/sections/Hero";
import { ProblemSolution } from "@/components/landing/sections/ProblemSolution";
import { Features } from "@/components/landing/sections/Features";
import { Vocabulary } from "@/components/landing/sections/Vocabulary";
import { Gamification } from "@/components/landing/sections/Gamification";
import { Testimonials } from "@/components/landing/sections/Testimonials";
import { Pricing } from "@/components/landing/sections/Pricing";
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
        <Vocabulary />
        <Gamification />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
