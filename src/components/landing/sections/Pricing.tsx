"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, ShieldCheck, Sparkles, Star, Zap, Info, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("monthly");

  const plans = [
    {
      name: "Découverte",
      price: "0",
      desc: "Idéal pour tester votre niveau et découvrir l'univers LlamaKuzy sans engagement.",
      features: [
        "1 correction IA / jour (Flash)",
        "Test de positionnement A1-B2",
        "Accès limité aux leçons FLE",
        "Pas de carte bancaire",
        "Essai 7 jours inclus"
      ],
      cta: "Essayer gratuitement",
      highlight: false
    },
    {
      name: "Premium",
      price: billingCycle === "monthly" ? "55" : "45",
      desc: "La solution complète pour réussir votre TEF IRN sans stress avec un accompagnement 24/7.",
      features: [
        "Corrections Écrites ILLIMITÉES",
        "Coach Oral 40 min / jour",
        "Parcours Adaptatif Complet",
        "Simulateur d'examen réel",
        "Accès 24/7 Mobile & PC",
        "Garantie de succès LlamaKusi"
      ],
      cta: "Choisir Premium",
      highlight: true,
      badge: billingCycle === "annually" ? "-20% ÉCONOMIE" : "LE PLUS POPULAIRE"
    },
    {
      name: "Super Premium",
      price: billingCycle === "monthly" ? "78" : "65",
      desc: "L'immersion totale avec un suivi prioritaire pour une naturalisation garantie.",
      features: [
        "Tout le contenu Premium",
        "Coach Oral ILLIMITÉ",
        "Simulateur Avancé illimité",
        "Support Prioritaire (WhatsApp)",
        "Correction humaine (1/mois)",
        "Éligible CPF (Qualiopi en cours)"
      ],
      cta: "Viser l'excellence",
      highlight: false
    }
  ];

  return (
    <section id="pricing" className="py-32 px-6 bg-white dark:bg-brand-dark relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50/50 dark:bg-white/[0.01] -skew-x-12 translate-x-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col items-center text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-gold/10 border border-brand-gold/20 mb-8"
          >
            <Sparkles size={14} className="text-brand-gold" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-gold">Tarification Transparente</span>
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight text-slate-900 dark:text-white">
            Un investissement pour <br />
            <span className="text-brand-blue">votre avenir en France.</span>
          </h2>

          <div className="flex items-center gap-4 bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 mb-12">
             <button
               onClick={() => setBillingCycle("monthly")}
               className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${billingCycle === "monthly" ? "bg-white dark:bg-slate-800 text-brand-blue shadow-lg" : "text-slate-400 hover:text-slate-600"}`}
             >
               Mensuel
             </button>
             <button
               onClick={() => setBillingCycle("annually")}
               className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${billingCycle === "annually" ? "bg-white dark:bg-slate-800 text-brand-blue shadow-lg" : "text-slate-400 hover:text-slate-600"}`}
             >
               Annuel
               <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] rounded-full font-black uppercase">Économisez</span>
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
           {plans.map((plan, i) => (
             <motion.div
               key={plan.name}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: i * 0.1 }}
               className={`relative p-10 rounded-[3.5rem] border-2 flex flex-col transition-all duration-500 ${plan.highlight ? 'bg-brand-blue dark:bg-brand-purple text-white border-brand-blue dark:border-brand-purple shadow-2xl scale-105 z-10' : 'bg-slate-50 dark:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/10 shadow-xl'}`}
             >
                {plan.badge && (
                  <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full bg-brand-gold text-brand-dark font-black text-[10px] uppercase tracking-widest shadow-xl whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-8">
                   <h3 className="text-sm font-black mb-4 uppercase tracking-[0.2em] opacity-80">{plan.name}</h3>
                   <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">€</span>
                      <span className="text-6xl font-black tracking-tighter">{plan.price}</span>
                      <span className="text-sm font-bold opacity-70">/ mois</span>
                   </div>
                   {billingCycle === "annually" && plan.price !== "0" && (
                     <p className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-60">facturé annuellement</p>
                   )}
                </div>

                <p className={`text-sm font-medium leading-relaxed mb-10 ${plan.highlight ? 'text-indigo-100' : 'text-slate-500'}`}>
                  {plan.desc}
                </p>

                <ul className="space-y-4 mb-12 flex-1">
                   {plan.features.map((feature, idx) => (
                     <li key={idx} className="flex items-start gap-3 text-sm font-bold">
                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? 'bg-white/20 text-white' : 'bg-brand-blue/10 text-brand-blue dark:text-brand-gold'}`}>
                           <Check size={12} strokeWidth={4} />
                        </div>
                        {feature}
                     </li>
                   ))}
                </ul>

                <Link href="/TEF_IRN/login?mode=signup">
                   <Button
                     className={`w-full h-16 rounded-2xl font-black text-lg transition-all group ${plan.highlight ? 'bg-white text-brand-blue hover:bg-slate-100 shadow-xl' : 'bg-brand-blue text-white hover:bg-brand-blue/90 shadow-lg'}`}
                   >
                      {plan.cta}
                      <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                   </Button>
                </Link>

                {plan.highlight && (
                   <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-200">
                      <ShieldCheck size={14} />
                      Garantie de réussite incluse
                   </div>
                )}
             </motion.div>
           ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 flex flex-col items-center gap-8"
        >
           <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest">
                 <ShieldCheck className="text-brand-blue" /> Qualiopi conforme
              </div>
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest">
                 <Star className="text-brand-gold" size={16} fill="currentColor" /> Success Rate 98%
              </div>
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest">
                 <Zap className="text-brand-purple" /> Éligible CPF bientôt
              </div>
           </div>

           <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10 max-w-2xl text-center">
             <p className="text-slate-500 dark:text-slate-400 font-bold text-xs leading-relaxed flex items-center justify-center gap-2">
               <Info size={16} className="shrink-0" />
               Tous les abonnements incluent l'accès à la communauté LlamaKusi et aux mises à jour régulières des simulateurs d'examen basées sur les derniers référentiels.
             </p>
           </div>
        </motion.div>
      </div>
    </section>
  );
}
