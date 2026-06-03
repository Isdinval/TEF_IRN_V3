"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, Loader2, ShieldCheck, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  const handleCheckout = async (priceId: string) => {
    alert("Le système de paiement est en cours de configuration. Pour activer votre compte Premium manuellement pendant la beta, contactez hello@maitris.fr");
  };

  const tiers = [
    {
      name: "Découverte",
      price: { monthly: "0€", yearly: "0€" },
      desc: "Idéal pour tester la plateforme.",
      features: [
        "1 Session de coaching IA",
        "Accès aux leçons A1/A2",
        "1 Examen blanc complet",
        "Statistiques de base",
        "Accès communauté"
      ],
      cta: "Commencer gratuitement",
      highlight: false,
      popular: false
    },
    {
      name: "Réussite",
      price: { monthly: "24€", yearly: "149€" },
      desc: "Tout ce qu'il faut pour le B2.",
      features: [
        "Coaching IA Illimité",
        "Expression Orale (Realtime)",
        "Accès complet A1 -> B2",
        "Examens blancs illimités",
        "Radar de compétences IA",
        "Correction d'écrits illimitée"
      ],
      cta: "Choisir ce plan",
      highlight: true,
      popular: true,
      priceId: "price_reussite"
    },
    {
      name: "Accompagné",
      price: { monthly: "49€", yearly: "399€" },
      desc: "Pour une préparation intensive.",
      features: [
        "Tout le plan Réussite",
        "Générateur d'exercices sur-mesure",
        "Support prioritaire 24/7",
        "Analyses de progression avancées",
        "Accès anticipé aux nouveautés"
      ],
      cta: "Passer en mode Intensif",
      highlight: false,
      popular: false,
      priceId: "price_intensif"
    }
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100">
      {/* Header */}
      <section className="pt-20 pb-16 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-50 border-indigo-100 mb-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
            Tarifs simples et transparents
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-black tracking-tight mb-6 text-zinc-900">
            Le seul coach dont vous avez besoin pour le <span className="text-indigo-600">TEF IRN</span>.
          </h1>
          <p className="text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
            Économisez des centaines d'euros en cours privés. Notre IA vous accompagne 24h/24 jusqu'à votre réussite.
          </p>

          {/* Billing Toggle */}
          <div className="mt-12 flex items-center justify-center gap-4">
            <span className={`text-sm font-bold ${billingCycle === "monthly" ? "text-zinc-900" : "text-zinc-400"}`}>Mensuel</span>
            <button
              onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
              className="w-14 h-8 bg-zinc-100 rounded-full p-1 relative flex items-center transition-colors"
            >
              <motion.div
                animate={{ x: billingCycle === "monthly" ? 0 : 24 }}
                className="w-6 h-6 bg-indigo-600 rounded-full shadow-sm"
              />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${billingCycle === "yearly" ? "text-zinc-900" : "text-zinc-400"}`}>Annuel</span>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-black text-[9px] uppercase tracking-tighter">
                -40% Économie
              </Badge>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex"
            >
              <Card className={`relative flex flex-col w-full rounded-[2.5rem] border-2 transition-all duration-300 overflow-hidden ${tier.highlight ? 'border-indigo-600 shadow-2xl shadow-indigo-100' : 'border-zinc-100 shadow-none'}`}>
                {tier.popular && (
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white px-6 py-2 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest">
                    Plus Populaire
                  </div>
                )}

                <CardHeader className="p-8 lg:p-10 pb-0">
                  <CardTitle className="text-xl font-bold text-zinc-900 mb-2">{tier.name}</CardTitle>
                  <CardDescription className="text-zinc-500 font-medium">{tier.desc}</CardDescription>
                  <div className="mt-8 flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tight text-zinc-900">
                      {billingCycle === "monthly" ? tier.price.monthly : tier.price.yearly}
                    </span>
                    <span className="text-zinc-400 font-bold text-sm uppercase">/ {billingCycle === "monthly" ? "mois" : "an"}</span>
                  </div>
                </CardHeader>

                <CardContent className="p-8 lg:p-10 pt-10 flex-1">
                  <ul className="space-y-4">
                    {tier.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm font-semibold text-zinc-700">
                        <div className="mt-0.5 p-0.5 rounded-full bg-indigo-50">
                          <Check size={14} className="text-indigo-600" strokeWidth={3} />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="p-8 lg:p-10 pt-0">
                  <Button
                    className={`w-full h-14 rounded-2xl font-bold text-lg transition-all active:scale-95 ${tier.highlight ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200' : 'bg-zinc-900 hover:bg-zinc-800 text-white'}`}
                    onClick={() => tier.priceId ? handleCheckout(tier.priceId) : (window.location.href='/login')}
                  >
                    {tier.cta}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-zinc-50 py-24 px-6 border-t border-zinc-100">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900">Garantie Intégration</h3>
            <p className="text-zinc-500 font-medium leading-relaxed">
              Nous sommes tellement convaincus de l'efficacité de Maitris que si vous n'obtenez pas votre niveau après avoir complété votre plan, nous vous offrons 3 mois supplémentaires gratuitement.
            </p>
          </div>
          <div className="space-y-6">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600">
              <HelpCircle size={28} />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900">Puis-je annuler ?</h3>
            <p className="text-zinc-500 font-medium leading-relaxed">
              Oui, vous pouvez annuler votre abonnement mensuel à tout moment en un clic depuis votre tableau de bord. Sans engagement, sans frais cachés.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto bg-indigo-600 rounded-[3rem] p-12 lg:p-16 relative overflow-hidden shadow-2xl shadow-indigo-200">
           {/* Decor */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

           <h2 className="text-3xl lg:text-4xl font-black text-white mb-6 relative z-10">Prêt à obtenir votre B2 ?</h2>
           <p className="text-indigo-100 text-lg mb-10 relative z-10 opacity-90">
             Ne perdez plus de temps avec des méthodes obsolètes. Commencez votre transformation aujourd'hui.
           </p>
           <Link href="/login">
            <Button size="lg" className="h-16 px-10 bg-white text-indigo-600 hover:bg-indigo-50 font-black text-xl rounded-2xl relative z-10">
              C'est parti ! <Sparkles className="ml-2" />
            </Button>
           </Link>
        </div>
      </section>
    </div>
  );
}
