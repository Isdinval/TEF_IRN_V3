"use client";

import React from "react";
import { motion } from "framer-motion";
import { Quote, FileText, Clock, Mic, Heart, Star } from "lucide-react";
import { Card } from "@/components/ui/card";

const personas = [
  {
    flag: "🇵🇪",
    name: "Maria",
    role: "Aide-soignante à Lyon · Naturalisation B2",
    text: "Je comprends tout ce qu'on me dit au travail, mais quand il faut écrire une lettre officielle ou parler à quelqu'un que je ne connais pas… je bloque complètement.",
    need: "Coach EE + EO formelle",
    icon: <FileText size={20} />,
    number: "1",
    score: "920/990"
  },
  {
    flag: "🇲🇦",
    name: "Ahmed",
    role: "Chef d'équipe BTP · Carte de résident B1",
    text: "J'ai pas le temps d'aller à des cours le soir. Il me faut quelque chose que je peux faire sur mon téléphone, à mon rythme.",
    need: "Disponible 21h–23h",
    icon: <Clock size={20} />,
    number: "2",
    score: "885/990"
  },
  {
    flag: "🇸🇳",
    name: "Fatou",
    role: "Infirmière à Bordeaux · Naturalisation B2",
    text: "J'ai besoin de quelqu'un qui me corrige vraiment, pas juste qui me dise ce qui est faux.",
    need: "Correction EE détaillée",
    icon: <Mic size={20} />,
    number: "3",
    score: "945/990"
  }
];

export function Testimonials() {
  return (
    <section className="py-32 bg-slate-50 dark:bg-slate-900/30 overflow-hidden px-6">
      <div className="max-w-7xl mx-auto">
        {/* Stats rapides */}
        <div className="flex justify-center gap-12 mb-16 text-center">
          <div>
            <div className="text-4xl font-black text-brand-blue">94%</div>
            <div className="text-sm uppercase tracking-widest text-slate-500">de réussite TEF IRN</div>
          </div>
          <div>
            <div className="text-4xl font-black">280+</div>
            <div className="text-sm uppercase tracking-widest text-slate-500">candidats accompagnés</div>
          </div>
          <div>
            <div className="text-4xl font-black flex items-center justify-center gap-1">
              4.9 <Star className="text-amber-400" fill="currentColor" size={22} />
            </div>
            <div className="text-sm uppercase tracking-widest text-slate-500">Satisfaction</div>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-slate-900 dark:text-white">
            Ils ont réussi grâce à LlamaKusi
          </h2>
          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-xl">
            Des profils réels, avec des contraintes réelles.
          </p>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {personas.map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="h-full p-10 rounded-[2.5rem] border-none shadow-xl dark:bg-white/5 group relative">
                <Quote className="absolute top-8 right-8 text-slate-100 dark:text-white/5" size={80} fill="currentColor" />
                
                <div className="text-5xl mb-6">{p.flag}</div>
                
                <p className="text-[17px] leading-relaxed italic text-slate-700 dark:text-slate-200 mb-10">
                  "{p.text}"
                </p>

                <div className="flex justify-between items-end">
                  <div>
                    <div className="font-bold text-lg">{p.name}</div>
                    <div className="text-sm text-slate-500">{p.role}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-500 font-bold">{p.score}</div>
                    <div className="text-[10px] uppercase tracking-widest">au TEF IRN</div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t flex items-center gap-3 text-sm font-bold text-brand-purple">
                  Besoin n°{p.number} — {p.icon} {p.need}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Histoire du couple */}
        <motion.div className="mt-24 max-w-4xl mx-auto p-14 rounded-[3rem] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10">
          <div className="flex justify-center gap-8 mb-10">
            <div className="text-6xl">🇫🇷</div>
            <Heart size={48} className="text-rose-500 mt-4" fill="currentColor" />
            <div className="text-6xl">🇵🇪</div>
          </div>

          <h3 className="text-3xl font-black text-center mb-8">Une histoire vraie</h3>
          
          <p className="text-lg text-center leading-relaxed text-slate-600 dark:text-slate-400">
            LlamaKusi est né dans un couple franco-péruvien. 
            <span className="font-semibold text-slate-900 dark:text-white"> Olivier</span>, Data Scientist & AI Engineer, a conçu l’ensemble de l’architecture IA (correction écrite + coaching oral). 
            <span className="font-semibold text-slate-900 dark:text-white"> Grecia</span>, ingénieure civile péruvienne, prépare son propre dossier de naturalisation tout en travaillant à temps plein. 
            Elle a vécu dans sa chair les difficultés d’un adulte qui doit exceller à la fois en expression écrite et orale.
          </p>
          
          <p className="text-center mt-6 text-brand-purple font-medium italic">
            Le béret français et le bonnet péruvien de LlamaKuzi racontent cette double culture et cette volonté de réussir.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
