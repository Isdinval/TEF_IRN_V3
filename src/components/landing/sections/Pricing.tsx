"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, ShieldCheck, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const plans = [
  {
    name: "Gratuit",
    priceMonthly: 0,
    desc: "Pour découvrir la plateforme et tester votre niveau réel.",
    features: [
      "Test de positionnement A1 → B2",
      "1 correction d'Expression Écrite",
      "Accès limité au vocabulaire SRS",
      "3 séries d'exercices / jour"
    ],
    cta: "Commencer gratuitement",
    highlight: false
  },
  {
    name: "Premium",
    priceMonthly: 55,
    desc: "Le coach complet pour préparer l'EE et l'EO sans limite.",
    features: [
      "Coach Expression Écrite illimité (GPT-4o)",
      "Coach Oral 40 min / jour (Realtime API)",
      "Parcours adaptatif A1 → B2 + SRS",
      "Dashboard XP, streaks & radar de compétences",
      "Simulateur d'examen complet"
    ],
    cta: "Démarrer l'essai gratuit",
    highlight: true,
    badge: "LE PLUS CHOISI"
  },
  {
    name: "Super Premium",
    priceMonthly: 78,
    desc: "Pour une préparation intensive, à l'approche de l'examen.",
    features: [
      "Tout Premium, en illimité",
      "Coach Oral 75 min / jour",
      "Correction écrite prioritaire",
      "Simulateur d'examen avancé"
    ],
    cta: "Démarrer l'essai gratuit",
    highlight: false
  }
];

export function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("monthly");

  return (
    <section id="pricing" className="py-32 px-6 bg-slate-900 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col items-center text-center mb-10">
          <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight text-white">
            Un investissement pour <br />
            <span className="text-brand-gold">votre avenir.</span>
          </h2>
          <p className="text-lg text-slate-400 font-medium max-w-xl">
            Une formation traditionnelle coûte <span className="line-through">300 à 800 €</span> pour une préparation complète.
            LlamaKusi, c&apos;est <span className="font-black text-white">5 à 14 fois moins cher</span>, pour un entraînement illimité.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center gap-4 bg-white/5 p-1.5 rounded-2xl border border-white/10 mt-10">
             <button
               onClick={() => setBillingCycle("monthly")}
               className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${billingCycle === "monthly" ? "bg-white text-brand-blue shadow-lg" : "text-slate-400 hover:text-white"}`}
             >
               Mensuel
             </button>
             <button
               onClick={() => setBillingCycle("annually")}
               className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${billingCycle === "annually" ? "bg-white text-brand-blue shadow-lg" : "text-slate-400 hover:text-white"}`}
             >
               Annuel
               <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] rounded-full">-20%</span>
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
           {plans.map((plan, i) => {
             const isFree = plan.priceMonthly === 0;
             const displayPrice = isFree
               ? 0
               : billingCycle === "annually"
                 ? Math.round(plan.priceMonthly * 0.8)
                 : plan.priceMonthly;

             return (
               <motion.div
                 key={plan.name}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: i * 0.1 }}
                 className={`relative p-10 rounded-[3rem] border-2 transition-all duration-500 ${plan.highlight ? 'bg-brand-blue text-white border-brand-blue shadow-2xl scale-105 z-10' : 'bg-white/5 border-transparent hover:border-white/10'}`}
               >
                  {plan.badge && (
                    <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full bg-brand-gold text-brand-dark font-black text-xs uppercase tracking-widest shadow-xl">
                      {plan.badge}
                    </div>
                  )}

                  <div className="mb-8">
                     <h3 className={`text-xl font-black mb-2 uppercase tracking-widest ${plan.highlight ? 'opacity-80' : 'text-white opacity-80'}`}>{plan.name}</h3>
                     <div className="flex items-baseline gap-1 text-white">
                        {!isFree && <span className="text-2xl font-bold">€</span>}
                        <span className="text-5xl font-black tracking-tighter">{displayPrice}</span>
                        {!isFree && <span className="text-sm font-bold opacity-70">/ mois{billingCycle === "annually" ? "*" : ""}</span>}
                     </div>
                     {!isFree && billingCycle === "annually" && (
                       <p className="text-xs font-bold mt-2 text-white opacity-60">*(facturé {Math.round(displayPrice * 12)}€ / an)</p>
                     )}
                  </div>

                  <p className={`text-sm font-medium leading-relaxed mb-10 ${plan.highlight ? 'text-indigo-100' : 'text-slate-500'}`}>
                    {plan.desc}
                  </p>

                  <ul className="space-y-4 mb-12">
                     {plan.features.map((feature, idx) => (
                       <li key={idx} className={`flex items-start gap-3 text-sm font-bold ${plan.highlight ? '' : 'text-slate-200'}`}>
                          <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? 'bg-white/20 text-white' : 'bg-white/10 text-brand-gold'}`}>
                             <Check size={12} strokeWidth={4} />
                          </div>
                          {feature}
                       </li>
                     ))}
                  </ul>

                  <Link href="/tef-irn/login?mode=signup">
                     <Button
                       className={`w-full h-14 rounded-2xl font-black text-lg transition-all ${plan.highlight ? 'bg-white text-brand-blue hover:bg-slate-100' : 'bg-brand-blue text-white hover:bg-brand-blue/90'}`}
                     >
                        {plan.cta}
                     </Button>
                  </Link>

                  {!isFree && (
                     <div className={`mt-6 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest ${plan.highlight ? 'text-indigo-200' : 'text-slate-400'}`}>
                        <ShieldCheck size={14} />
                        Essai 7 jours • Sans engagement • Annulation en 1 clic
                     </div>
                  )}
               </motion.div>
             );
           })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 flex flex-col items-center gap-4 text-center"
        >
           <p className="flex items-center justify-center gap-2 text-slate-400 font-bold">
             <Sparkles size={16} className="text-brand-gold" />
             Prix transparents, aucune charge cachée. Déjà client ? <Link href="/tef-irn/login" className="text-brand-gold underline">Connectez-vous ici</Link>.
           </p>
           <p className="flex items-center justify-center gap-2 text-sm font-black text-brand-gold">
             <Flame size={14} />
             Bientôt éligible au CPF — préparez et passez votre TEF IRN sans rien sortir de votre poche.
           </p>
        </motion.div>
      </div>
    </section>
  );
}
