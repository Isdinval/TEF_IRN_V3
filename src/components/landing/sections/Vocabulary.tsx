"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Play, Rotate3d, CheckCircle2, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";

const vocabWords = [
  { word: "La Citoyenneté", translation: "Citizenship", definition: "Qualité de citoyen d'un État, avec ses droits et devoirs.", example: "Obtenir la citoyenneté française est mon objectif.", srs: "4 jours" },
  { word: "La Laïcité", translation: "Secularism", definition: "Principe de séparation de la société civile et de la société religieuse.", example: "La laïcité est un pilier de la République.", srs: "Demain" },
  { word: "L'Égalité", translation: "Equality", definition: "Fait d'être égal devant la loi, sans distinction.", example: "Liberté, Égalité, Fraternité.", srs: "Maîtrisé" }
];

export function Vocabulary() {
  const [flipped, setFlipped] = useState<number | null>(null);

  return (
    <section id="vocab" className="py-32 px-6 overflow-hidden bg-slate-50 dark:bg-slate-900/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
           <motion.div
             initial={{ opacity: 0, x: -50 }}
             whileInView={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.8 }}
             viewport={{ once: true }}
           >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-xs font-black uppercase tracking-wider mb-6">
                <Languages size={12} />
                <span>Mémorisation Scientifique</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight text-slate-900 dark:text-white">
                Mémorisez le vocabulaire essentiel, <br />
                <span className="text-brand-gold">sans effort.</span>
              </h2>
              <p className="text-xl text-slate-500 dark:text-slate-400 mb-10 leading-relaxed font-medium">
                Notre système de répétition espacée (SRS) calcule le moment exact où vous allez oublier un mot pour vous le faire réviser.
              </p>

              <ul className="space-y-6 mb-12">
                 {[
                   "1 500+ mots triés sur le volet pour le TEF IRN",
                   "Audio HD pour chaque mot (prononciation parfaite)",
                   "Images contextuelles pour une meilleure rétention",
                   "Mode révision rapide pour les moments perdus"
                 ].map((item, i) => (
                   <li key={i} className="flex items-center gap-4 text-lg font-bold text-slate-700 dark:text-slate-200">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 shrink-0">
                         <CheckCircle2 size={16} />
                      </div>
                      {item}
                   </li>
                 ))}
              </ul>

              <Button className="h-14 px-8 bg-brand-gold hover:bg-brand-gold/90 text-brand-dark font-black rounded-2xl shadow-xl shadow-brand-gold/20">
                Explorer le dictionnaire
              </Button>
           </motion.div>

           <div className="relative">
              <div className="absolute inset-0 bg-brand-gold/20 blur-[120px] rounded-full -z-10" />
              <div className="grid grid-cols-1 gap-6 perspective-1000">
                 {vocabWords.slice(0, 1).map((item, i) => (
                   <div
                     key={i}
                     className="relative w-full h-[450px] cursor-pointer group"
                     onClick={() => setFlipped(flipped === i ? null : i)}
                   >
                     <motion.div
                       className="w-full h-full relative transform-style-3d"
                       initial={false}
                       animate={{ rotateY: flipped === i ? 180 : 0 }}
                       transition={{ duration: 0.8, type: "spring", stiffness: 260, damping: 20 }}
                     >
                       {/* Front */}
                       <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-800 rounded-[4rem] p-12 shadow-2xl border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center text-center gap-8">
                          <div className="w-24 h-24 rounded-3xl bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-4 group-hover:rotate-12 transition-transform">
                             <Rotate3d size={48} />
                          </div>
                          <div>
                             <h3 className="text-4xl font-black mb-3 text-slate-900 dark:text-white">{item.word}</h3>
                             <p className="text-xl font-bold text-brand-gold opacity-80 uppercase tracking-[0.2em]">{item.translation}</p>
                          </div>
                          <div className="flex flex-col items-center gap-4">
                             <div className="w-16 h-16 rounded-full bg-brand-blue flex items-center justify-center text-white shadow-xl shadow-brand-blue/30 hover:scale-110 transition-transform">
                                <Play size={24} fill="currentColor" />
                             </div>
                             <div className="px-6 py-2 rounded-full bg-slate-100 dark:bg-white/5 font-black uppercase tracking-widest text-[10px] text-slate-400">
                                Cliquez pour retourner la carte
                             </div>
                          </div>
                       </div>

                       {/* Back */}
                       <div
                         className="absolute inset-0 backface-hidden bg-slate-900 rounded-[4rem] p-12 shadow-2xl border border-white/10 flex flex-col justify-between rotate-y-180 text-white"
                       >
                          <div className="space-y-10">
                             <div>
                                <div className="text-[10px] font-black text-brand-gold uppercase tracking-[0.3em] mb-4">Définition</div>
                                <p className="text-2xl font-bold leading-relaxed">{item.definition}</p>
                             </div>
                             <div>
                                <div className="text-[10px] font-black text-brand-blue uppercase tracking-[0.3em] mb-4">Exemple</div>
                                <p className="text-xl font-bold italic text-slate-400 leading-relaxed">“{item.example}”</p>
                             </div>
                          </div>

                          <div className="flex items-center justify-between pt-8 border-t border-white/10">
                             <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase opacity-50 tracking-[0.3em] mb-1">Status SRS</span>
                                <span className="text-brand-purple font-black text-xl">{item.srs}</span>
                             </div>
                             <div className="w-12 h-12 rounded-full bg-brand-purple/20 flex items-center justify-center text-brand-purple">
                                <CheckCircle2 size={24} />
                             </div>
                          </div>
                       </div>
                     </motion.div>
                   </div>
                 ))}

                 {/* Stack of other cards effect */}
                 <div className="absolute top-6 left-6 -right-6 -bottom-6 bg-slate-200/50 dark:bg-slate-800/40 rounded-[4rem] -z-10 border border-slate-200 dark:border-white/5" />
                 <div className="absolute top-12 left-12 -right-12 -bottom-12 bg-slate-100/50 dark:bg-slate-800/20 rounded-[4rem] -z-20 border border-slate-200 dark:border-white/5" />
              </div>
           </div>
        </div>
      </div>
    </section>
  );
}
