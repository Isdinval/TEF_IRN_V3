"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Card } from "@/components/ui/card";

const testimonials = [
  {
    name: "Fatima",
    location: "Lyon",
    text: "J'avais déjà raté le TEF IRN... L'expression orale m'inquiétait. Grâce à l'IA, j'ai obtenu mon B2. Naturalisation obtenue en 2 mois.",
    score: "Niveau B2",
    avatar: "F"
  },
  {
    name: "Sami",
    location: "Paris",
    text: "Le système de répétition espacée est magique pour le vocabulaire. Je révisais dans le métro, 15 min par jour. Résultat : 580/600.",
    score: "Niveau B1+",
    avatar: "S"
  },
  {
    name: "Elena",
    location: "Bordeaux",
    text: "Maitris est 10 fois plus moderne que ce qu'on trouve ailleurs. La correction écrite instantanée change tout pour la confiance.",
    score: "Niveau B2",
    avatar: "E"
  }
];

export function Testimonials() {
  return (
    <section className="py-32 bg-slate-50 dark:bg-slate-900/30 overflow-hidden px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-24">
           <div className="flex gap-1 text-brand-gold mb-6">
              {[1,2,3,4,5].map(i => <Star key={i} size={20} fill="currentColor" />)}
           </div>
           <h2 className="text-4xl md:text-6xl font-black mb-8 text-slate-900 dark:text-white">
             Ils ont franchi le pas <br />
             <span className="text-brand-blue">vers leur nouvelle vie.</span>
           </h2>
           <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">
             Plus de 15 000 candidats nous ont fait confiance. Rejoignez-les.
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
                <Card className="h-full p-10 rounded-[3.5rem] border-none shadow-2xl shadow-zinc-200/50 shadow-slate-200/50 dark:shadow-none dark:bg-white/5 relative overflow-hidden flex flex-col">
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
                         <div className="text-xs font-black text-brand-purple uppercase tracking-widest">{t.score}</div>
                      </div>
                   </div>
                </Card>
             </motion.div>
           ))}
        </div>

        <div className="mt-24 flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
           {/* Placeholder for partner logos */}
           <div className="text-2xl font-black text-slate-900 dark:text-white">TRUSTPILOT</div>
           <div className="text-2xl font-black text-slate-900 dark:text-white">GOOGLE REVIEWS</div>
           <div className="text-2xl font-black text-slate-900 dark:text-white">FLE-CERTIFIED</div>
           <div className="text-2xl font-black text-slate-900 dark:text-white">CAMPUS FRANCE</div>
        </div>
      </div>
    </section>
  );
}
