"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, Rocket, Loader2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string) => {
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      alert("Le système de paiement est en cours de configuration. Contactez le support.");
      return;
    }
    setLoading(priceId);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({ priceId }),
        headers: { "Content-Type": "application/json" },
      });
      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      await (stripe as any)?.redirectToCheckout({ sessionId });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const tiers = [
    {
      name: "Découverte",
      price: "0€",
      desc: "Pour tester la méthode.",
      features: ["10 crédits IA inclus", "Accès aux leçons A1/A2", "1 examen blanc", "Support standard"],
      cta: "Commencer gratuitement",
      highlight: false
    },
    {
      name: "Premium",
      price: "29€",
      desc: "L'essentiel pour réussir.",
      features: ["Crédits IA illimités (Standard)", "Accès complet A1 -> B2", "Examens blancs illimités", "Radar de compétences", "Moteur de recommandation"],
      cta: "Devenir Premium",
      highlight: true,
      priceId: "price_premium_standard"
    },
    {
      name: "Coaching Pro",
      price: "49€",
      desc: "Le succès garanti.",
      features: ["Tout le Premium", "Mode IA Ultra-Réaliste", "Corrections prioritaires", "Générateur d'exercices", "Accès à vie"],
      cta: "Choisir le Coaching",
      highlight: false,
      priceId: "price_coaching_pro"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-8 pt-20">
      <header className="text-center mb-16">
        <Badge className="bg-indigo-600 mb-4 px-4 py-1.5 rounded-full text-xs font-black">NOS OFFRES</Badge>
        <h1 className="text-5xl font-black tracking-tight mb-4 text-slate-900">Investissez dans votre avenir</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Choisissez le plan qui correspond à votre objectif. Réussissez votre TEF IRN du premier coup grâce à l'IA.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {tiers.map((tier, i) => (
          <Card key={i} className={`relative flex flex-col rounded-[2.5rem] border-2 transition-all hover:scale-105 duration-500 ${tier.highlight ? 'border-indigo-600 shadow-2xl shadow-indigo-100 bg-indigo-600 text-white' : 'border-slate-100 bg-white shadow-none'}`}>
            {tier.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-white">
                RECOMMANDÉ
              </div>
            )}
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-black mb-2">{tier.name}</CardTitle>
              <CardDescription className={tier.highlight ? 'text-indigo-100' : ''}>{tier.desc}</CardDescription>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-black">{tier.price}</span>
                {tier.price !== "0€" && <span className="text-sm opacity-50">/ unique</span>}
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-6 flex-1">
              <ul className="space-y-4">
                {tier.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm font-medium">
                    <div className={`p-1 rounded-full ${tier.highlight ? 'bg-white/20' : 'bg-indigo-50'}`}>
                      <Check size={12} className={tier.highlight ? 'text-white' : 'text-indigo-600'} />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-8">
              <Button
                className={`w-full h-14 rounded-2xl font-black text-lg transition-all ${tier.highlight ? 'bg-white text-indigo-600 hover:bg-slate-50' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                onClick={() => tier.priceId ? handleCheckout(tier.priceId) : (window.location.href='/login')}
                disabled={!!loading}
              >
                {loading === tier.priceId ? <Loader2 className="animate-spin" /> : tier.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-24 p-12 bg-slate-50 rounded-[3rem] flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2 font-black text-indigo-600 uppercase text-xs tracking-widest">
            <Sparkles size={16} /> Mode Ultra-Réaliste
          </div>
          <h2 className="text-3xl font-black">Besoin de parler comme un vrai Français ?</h2>
          <p className="text-slate-600 text-lg">
            Notre technologie d'IA temps-réel simule un entretien réel sans latence. Idéal pour vaincre le stress de l'épreuve orale.
          </p>
        </div>
        <div className="flex gap-4">
           <Card className="p-6 rounded-2xl border-none shadow-xl shadow-slate-200 text-center space-y-2">
             <Zap className="mx-auto text-yellow-500" />
             <div className="font-bold">Zéro Latence</div>
           </Card>
           <Card className="p-6 rounded-2xl border-none shadow-xl shadow-slate-200 text-center space-y-2">
             <Rocket className="mx-auto text-indigo-600" />
             <div className="font-bold">Niveau B2</div>
           </Card>
        </div>
      </div>
    </div>
  );
}
