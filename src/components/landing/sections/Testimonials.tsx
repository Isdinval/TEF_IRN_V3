"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileText, Clock, Mic, Info } from "lucide-react";
import { Card } from "@/components/ui/card";

const personas = [
  {
    flag: "🇵🇪",
    name: "Maria",
    role: "Aide-soignante à Lyon · Naturalisation B2",
    text: "Je comprends tout ce qu'on me dit au travail, mais quand il faut écrire une lettre officielle ou parler à quelqu'un que je ne connais pas… je bloque complètement.",
    need: "Coach à l'écrit et à l'oral, dans un registre formel",
    icon: <FileText size={18} />,
    number: "1",
  },
  {
    flag: "🇲🇦",
    name: "Ahmed",
    role: "Chef d'équipe BTP · Carte de résident B1",
    text: "J'ai pas le temps d'aller à des cours le soir. Il me faut quelque chose que je peux faire sur mon téléphone, à mon rythme.",
    need: "Disponible le soir, entre 21h et 23h",
    icon: <Clock size={18} />,
    number: "2",
  },
  {
    flag: "🇸🇳",
    name: "Fatou",
    role: "Infirmière à Bordeaux · Naturalisation B2",
    text: "J'ai besoin de quelqu'un qui me corrige vraiment, pas juste qui me dise ce qui est faux.",
    need: "Correction écrite détaillée, pas juste un score",
    icon: <Mic size={18} />,
    number: "3",
  }
];

export function Testimonials() {
  return (
    <section className="py-32 bg-white dark:bg-brand-dark overflow-hidden px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider mb-6">
            <Info size={12} />
            <span>Exemples de parcours illustratifs</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-slate-900 dark:text-white">
            Vous vous reconnaissez ?
          </h2>
          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-xl">
            Des profils-types, avec des contraintes réelles de candidats à la naturalisation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {personas.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full p-10 rounded-[2.5rem] border-none shadow-xl bg-slate-50 dark:bg-white/5 group relative overflow-hidden hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
                {/* Drapeau décoratif en fond, seul élément dans ce coin (plus de superposition) */}
                <div className="absolute -top-4 -right-4 text-8xl opacity-5 group-hover:opacity-10 transition-opacity">
                  {p.flag}
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                    <span className="text-5xl transition-transform group-hover:scale-110 duration-300">{p.flag}</span>
                    <div>
                      <div className="font-black text-xl text-slate-900 dark:text-white">{p.name}</div>
                      <div className="text-sm text-slate-500">{p.role}</div>
                    </div>
                  </div>

                  <p className="text-[17px] leading-relaxed italic text-slate-700 dark:text-slate-200 mb-10">
                    "{p.text}"
                  </p>

                  <div className="pt-6 border-t border-slate-100 dark:border-white/10 flex items-center gap-3 text-sm font-bold text-brand-purple">
                    <span className="shrink-0">{p.icon}</span>
                    {p.need}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
