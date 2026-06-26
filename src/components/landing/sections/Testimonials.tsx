"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, Quote, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

const testimonials = [
  {
    name: "Maria",
    location: "Marseille",
    text: "Le stress de l'oral me paralysait. M'entraîner avec LlamaKuzy à 23h après le travail a tout changé. J'ai obtenu mon B1 haut la main !",
    score: "Niveau B1+",
    avatar: "M"
  },
  {
    name: "Ahmed",
    location: "Lille",
    text: "En tant que salarié, je n'avais pas le temps pour des cours classiques. LlamaKusi m'a permis de réviser mon expression écrite dans le bus. Résultat : Naturalisé !",
    score: "Niveau B2",
    avatar: "A"
  },
  {
    name: "Li",
    location: "Paris",
    text: "La correction instantanée est incroyable. On comprend ses erreurs tout de suite. Les 50 000 candidats annuels devraient tous l'utiliser.",
    score: "Niveau B2",
    avatar: "L"
  }
];

export function Testimonials() {
  return (
    <section id="social-proof" className="py-32 bg-slate-50 dark:bg-slate-900/30 overflow-hidden px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-24">
           <div className="flex gap-1 text-brand-gold mb-6">
              {[1,2,3,4,5].map(i => <Star key={i} size={20} fill="currentColor" />)}
           </div>
           <h2 className="text-4xl md:text-6xl font-black mb-8 text-slate-900 dark:text-white">
             Ils ont réussi leur <br />
             <span className="text-brand-blue">intégration avec nous.</span>
           </h2>
           <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
             Rejoignez la communauté de ceux qui ont transformé leur peur de l'examen en une réussite éclatante.
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {testimonials.map((t, i) => (
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

                   <p className="text-xl font-bold italic leading-relaxed text-slate-700 dark:text-slate-200 mb-10 relative z-10">
                     &quot;{t.text}&quot;
                   </p>

                   <div className="mt-auto flex items-center gap-4 relative z-10">
                      <div className="w-14 h-14 rounded-full bg-brand-blue flex items-center justify-center text-white font-black text-xl">
                         {t.avatar}
                      </div>
                      <div>
                         <div className="font-black text-slate-900 dark:text-white">{t.name}, {t.location}</div>
                         <div className="flex items-center gap-1 text-xs font-black text-brand-purple uppercase tracking-widest">
                            <CheckCircle size={12} className="text-emerald-500" /> {t.score}
                         </div>
                      </div>
                   </div>
                </Card>
             </motion.div>
           ))}
        </div>

        <div className="mt-24 flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
           <div className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-3xl">50k</span> CANDIDATS / AN
           </div>
           <div className="text-xl font-black text-slate-900 dark:text-white">CONFORME QUALIOPI</div>
           <div className="text-xl font-black text-slate-900 dark:text-white">NATURALISATION FR</div>
        </div>
      </div>
    </section>
  );
}
