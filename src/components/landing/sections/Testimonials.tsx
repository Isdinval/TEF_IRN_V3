"use client";

import React from "react";
import { motion } from "framer-motion";
import { Quote, FileText, Mic, Clock, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";

const personas = [
  {
    flag: "🇵🇪",
    name: "Maria",
    role: "Aide-soignante à Lyon · Naturalisation B2",
    text: "Je comprends tout ce qu'on me dit au travail, mais quand il faut écrire une lettre officielle ou parler à quelqu'un que je ne connais pas… je bloque complètement. J'ai besoin de m'entraîner, pas de cours de grammaire.",
    need: "Coach EE + EO formelle",
    icon: <FileText size={18} />
  },
  {
    flag: "🇲🇦",
    name: "Ahmed",
    role: "Chef d'équipe BTP · Carte de résident B1",
    text: "J'ai pas le temps d'aller à des cours le soir. Je rentre à 18h30, je mange avec mes enfants, et c'est tout. Il me faut quelque chose que je peux faire sur mon téléphone, à mon rythme, quand j'ai 20 minutes.",
    need: "Disponible 21h–23h",
    icon: <Clock size={18} />
  },
  {
    flag: "🇸🇳",
    name: "Fatou",
    role: "Infirmière à Bordeaux · Naturalisation B2",
    text: "J'ai fait une autre plateforme pendant 3 mois, j'ai réussi tout sauf l'Expression Écrite. Le problème, c'est qu'elle m'explique ce qui est faux, mais pas comment mieux faire. J'ai besoin de quelqu'un qui me corrige vraiment.",
    need: "Correction EE détaillée",
    icon: <Mic size={18} />
  }
];

export function Testimonials() {
  return (
    <section className="py-32 bg-slate-50 dark:bg-slate-900/30 overflow-hidden px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-24">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-brand-purple text-xs font-black uppercase tracking-wider mb-6">
              <Wallet size={12} />
              <span>Étude terrain — candidats réels au TEF IRN</span>
           </div>
           <h2 className="text-4xl md:text-6xl font-black mb-8 text-slate-900 dark:text-white">
             Conçu pour des profils <br />
             <span className="text-brand-blue">qui vous ressemblent.</span>
           </h2>
           <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
             LlamaKusi est construit à partir de dizaines d'entretiens avec des salariés étrangers en France — pas de personas marketing inventés.
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {personas.map((p, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: i * 0.1 }}
             >
                <Card className="h-full p-10 rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-white/5 relative overflow-hidden flex flex-col">
                   <div className="absolute top-0 right-0 p-8 text-slate-100 dark:text-white/5">
                      <Quote size={80} fill="currentColor" />
                   </div>

                   <p className="text-lg font-bold italic leading-relaxed text-slate-700 dark:text-slate-200 mb-10 relative z-10">
                     &quot;{p.text}&quot;
                   </p>

                   <div className="mt-auto flex items-center gap-4 relative z-10">
                      <div className="w-14 h-14 rounded-full bg-brand-blue flex items-center justify-center text-2xl">
                         {p.flag}
                      </div>
                      <div>
                         <div className="font-black text-slate-900 dark:text-white">{p.name}</div>
                         <div className="text-xs font-bold text-slate-400">{p.role}</div>
                      </div>
                   </div>
                   <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-purple">
                      {p.icon}
                      Besoin n°1 : {p.need}
                   </div>
                </Card>
             </motion.div>
           ))}
        </div>

        <div className="mt-20 text-center">
           <p className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold text-sm max-w-2xl mx-auto">
             Construit par Olivier (Data Scientist & AI Engineer) et Grecia, ingénieure civile elle-même en cours de naturalisation —
             une vision technique et une expérience vécue de l&apos;intégration en France.
           </p>
        </div>
      </div>
    </section>
  );
}
