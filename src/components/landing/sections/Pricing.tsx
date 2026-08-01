"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, ShieldCheck, Flame, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const plans = [
  {
    name: "Gratuit",
    priceMonthly: 0,
    price4Months: 0,
    desc: "Pour découvrir la plateforme et tester votre niveau réel.",
    features: [
      "Test de positionnement A1 → B2",
      "1 correction d'Expression Écrite",
      "Accès limité aux fiches de vocabulaire",
      "3 séries d'exercices / jour",
      "Entraînement Examen Civique illimité"
    ],
    cta: "Commencer gratuitement",
    highlight: false,
    guarantee: null
  },
  {
    name: "Essentiel",
    priceMonthly: 32.9,
    price4Months: 118.9,
    desc: "Pour progresser sérieusement à l'écrit et en compréhension, sans coach oral.",
    features: [
      "Coach Expression Écrite illimité",
      "Compréhension Écrite & Orale : parcours adaptatif A1 → B2",
      "Tableau de bord de progression : points, séries de jours et radar de compétences",
      "Simulateur d'examen complet",
      "Entraînement Examen Civique illimité"
    ],
    cta: "Choisir Essentiel",
    highlight: false,
    guarantee: "Remboursé sous 14 jours, sans condition."
  },
  {
    name: "Premium",
    priceMonthly: 54.9,
    price4Months: 197.9,
    desc: "Pour préparer sérieusement les 4 épreuves du TEF IRN.",
    features: [
      "Coach Expression Écrite illimité",
      "Coach Expression Orale : 40 min / jour",
      "Compréhension Écrite & Orale : parcours adaptatif A1 → B2",
      "Tableau de bord de progression : points, séries de jours et radar de compétences",
      "Simulateur d'examen complet",
      "Entraînement Examen Civique illimité"
    ],
    cta: "Choisir Premium",
    highlight: true,
    badge: "LE PLUS CHOISI",
    guarantee: "Remboursé sous 14 jours si moins de 60 min de coach oral utilisées."
  },
  {
    name: "Super Premium",
    priceMonthly: 77.9,
    price4Months: 279.9,
    desc: "Exactement Premium, avec plus de temps de coach oral par jour.",
    features: [
      "Coach Expression Écrite illimité",
      "Coach Expression Orale : 75 min / jour (au lieu de 40 min en Premium)",
      "Compréhension Écrite & Orale : parcours adaptatif A1 → B2",
      "Tableau de bord de progression : points, séries de jours et radar de compétences",
      "Simulateur d'examen complet",
      "Entraînement Examen Civique illimité"
    ],
    cta: "Choisir Super Premium",
    highlight: false,
    guarantee: "Remboursé sous 14 jours si moins de 90 min de coach oral utilisées."
  }
];

function formatPrice(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(2).replace(".", ",");
}

export function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "forfait4mois">("monthly");

  return (
    <section id="pricing" className="py-32 px-6 bg-indigo-50 dark:bg-indigo-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col items-center text-center mb-10">
          <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight text-slate-900 dark:text-white">
            Un investissement pour <br />
            <span className="text-brand-gold">votre avenir.</span>
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-xl">
            Une formation traditionnelle coûte <span className="line-through">300 à 800 €</span> pour une préparation complète au TEF IRN.
            LlamaKusi, c&apos;est <span className="font-black text-slate-900 dark:text-white">5 à 14 fois moins cher</span>, pour un entraînement illimité.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-black">
            🎓 L&apos;entraînement Examen Civique est 100% gratuit, sans carte bancaire — inclus dans tous les plans.
          </div>

          {/* Billing toggle */}
          <div className="flex items-center gap-4 bg-indigo-100 dark:bg-white/5 p-1.5 rounded-2xl border border-indigo-200 dark:border-white/10 mt-10">
             <button
               onClick={() => setBillingCycle("monthly")}
               className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${billingCycle === "monthly" ? "bg-white dark:bg-white text-brand-blue shadow-lg" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
             >
               Mensuel
             </button>
             <button
               onClick={() => setBillingCycle("forfait4mois")}
               className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${billingCycle === "forfait4mois" ? "bg-white dark:bg-white text-brand-blue shadow-lg" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
             >
               Forfait 4 mois
               <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] rounded-full">-10%</span>
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-center">
           {plans.map((plan, i) => {
             const isFree = plan.priceMonthly === 0;
             const isForfait = billingCycle === "forfait4mois";
             const displayPrice = isFree ? 0 : isForfait ? plan.price4Months : plan.priceMonthly;
             const monthlyEquivalent = isFree ? 0 : plan.price4Months / 4;

             return (
               <motion.div
                 key={plan.name}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: i * 0.1 }}
                 className={`relative p-10 rounded-[3rem] border-2 transition-all duration-300 ${plan.highlight ? 'bg-brand-blue text-white border-brand-blue shadow-2xl scale-105 hover:scale-[1.07] hover:shadow-brand-blue/40 z-10' : 'bg-white dark:bg-white/5 border-transparent hover:border-brand-blue/20 dark:hover:border-white/10 hover:-translate-y-2 hover:shadow-2xl'}`}
               >
                  {plan.badge && (
                    <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full bg-brand-gold text-brand-dark font-black text-xs uppercase tracking-widest shadow-xl">
                      {plan.badge}
                    </div>
                  )}

                  <div className="mb-8">
                     <h3 className={`text-xl font-black mb-2 uppercase tracking-widest ${plan.highlight ? 'opacity-80' : 'text-slate-900 dark:text-white opacity-80'}`}>{plan.name}</h3>
                     <div className={`flex items-baseline gap-1 ${plan.highlight ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                        <span className="text-2xl font-bold">€</span>
                        <span className="text-5xl font-black tracking-tighter">{formatPrice(displayPrice)}</span>
                        <span className="text-sm font-bold opacity-70">{isFree ? "/ mois" : isForfait ? "/ 4 mois*" : "/ mois"}</span>
                     </div>
                     {!isFree && isForfait && (
                       <p className={`text-xs font-bold mt-2 opacity-60 ${plan.highlight ? 'text-white' : 'text-slate-900 dark:text-white'}`}>*paiement unique, sans renouvellement (soit {formatPrice(monthlyEquivalent)}€/mois)</p>
                     )}
                  </div>

                  <p className={`text-sm font-medium leading-relaxed mb-10 ${plan.highlight ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    {plan.desc}
                  </p>

                  <ul className="space-y-4 mb-12">
                     {plan.features.map((feature, idx) => (
                       <li key={idx} className={`flex items-start gap-3 text-sm font-bold ${plan.highlight ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                          <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? 'bg-white/20 text-white' : 'bg-brand-blue/10 dark:bg-white/10 text-brand-blue dark:text-brand-gold'}`}>
                             <Check size={12} strokeWidth={4} />
                          </div>
                          {feature}
                       </li>
                     ))}
                  </ul>

                  <Link href="/tef-irn/login?mode=signup">
                     <Button
                       className={`group/btn w-full min-h-14 px-4 py-3 rounded-2xl font-black text-base whitespace-normal leading-snug transition-all duration-300 hover:scale-[1.03] active:scale-95 ${plan.highlight ? 'bg-white text-brand-blue hover:bg-slate-100 hover:shadow-xl' : 'bg-brand-blue text-white hover:bg-brand-blue/90 hover:shadow-xl hover:shadow-brand-blue/30'}`}
                     >
                        <span className="flex items-center justify-center gap-2 text-center">
                          {plan.cta}
                          <ChevronRight size={18} className="shrink-0 transition-transform duration-300 group-hover/btn:translate-x-1" />
                        </span>
                     </Button>
                  </Link>

                  {!isFree && (
                     <div className="mt-6 space-y-2">
                       <div className={`flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest ${plan.highlight ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`}>
                          <ShieldCheck size={14} />
                          {isForfait ? "Sans engagement • Paiement unique" : "Sans engagement • Annulation en 1 clic"}
                       </div>
                       {plan.guarantee && (
                         <div className={`text-center text-[11px] font-bold leading-snug ${plan.highlight ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                           {plan.guarantee}
                         </div>
                       )}
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
           <p className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 font-bold">
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
