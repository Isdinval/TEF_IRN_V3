import { Header } from "@/components/landing/Header";
import { Pricing } from "@/components/landing/sections/Pricing";
import { FAQ } from "@/components/landing/sections/FAQ";
import { Footer } from "@/components/landing/Footer";

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
