"use client";

import React from "react";
import { motion } from "framer-motion";
import { PenTool, Mic2, BrainCircuit, Sparkles, LayoutPanelLeft, LineChart, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    title: "Correction Écrite IA",
    desc: "Analyse ultra-précise de votre grammaire, syntaxe et vocabulaire. Recevez une note estimée et des conseils de reformulation en 3 secondes.",
    icon: <PenTool size={32} />,
    color: "bg-blue-500",
    delay: 0.1,
    mockup: "Writing"
  },
  {
    title: "Coaching Oral 24/7",
    desc: "Pratiquez l'expression orale sans stress. Notre IA analyse votre prononciation et votre fluidité sur tous les thèmes de l'examen.",
    icon: <Mic2 size={32} />,
    color: "bg-purple-500",
    delay: 0.2,
    mockup: "Oral"
  },
  {
    title: "Exercices Adaptatifs",
    desc: "QCM intelligents de niveau A1 à B2. La difficulté s'ajuste à votre progression réelle pour optimiser votre temps de travail.",
    icon: <BrainCircuit size={32} />,
    color: "bg-amber-500",
    delay: 0.3,
    mockup: "Practice"
  }
];

export function Features() {
  return (
    <section id="features" className="py-32 px-6 bg-white dark:bg-brand-dark overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-24">
           <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-brand-blue dark:text-brand-gold text-xs font-black uppercase tracking-wider mb-6">
                <Sparkles size={12} />
                <span>Propulsé par GPT-4o</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black leading-tight text-slate-900 dark:text-white">
                La technologie au service <br />
                <span className="text-slate-400">de votre réussite.</span>
              </h2>
           </div>
           <p className="text-xl text-slate-500 dark:text-slate-400 max-w-md font-medium leading-relaxed">
             Plus qu&apos;une plateforme, LlamaKusi est votre coach personnel qui vous accompagne jusqu&apos;au jour de l&apos;examen.
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {features.map((f, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.6, delay: f.delay }}
             >
                <Card className="group relative h-full rounded-[2.5rem] border-none bg-slate-50 dark:bg-white/5 p-10 overflow-hidden hover:translate-y-[-10px] transition-all duration-500">
                   <div className={`w-16 h-16 rounded-2xl ${f.color} flex items-center justify-center text-white shadow-xl shadow-opacity-20 mb-10 transition-transform group-hover:scale-110`}>
                      {f.icon}
                   </div>

                   <h3 className="text-2xl font-black mb-6 text-slate-900 dark:text-white">{f.title}</h3>
                   <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-12">
                      {f.desc}
                   </p>

                   <div className="relative mt-auto pt-10">
                      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-2xl p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                         <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5" />
                            <div className="h-3 w-24 bg-slate-100 dark:bg-white/5 rounded-full" />
                         </div>
                         <div className="space-y-2">
                            <div className="h-2 w-full bg-slate-50 dark:bg-white/5 rounded-full" />
                            <div className="h-2 w-full bg-slate-50 dark:bg-white/5 rounded-full" />
                            <div className="h-2 w-2/3 bg-slate-50 dark:bg-white/5 rounded-full" />
                         </div>
                         <div className="mt-4 flex justify-between items-center">
                            <div className="h-6 w-16 bg-brand-blue/10 dark:bg-brand-gold/10 rounded-full" />
                            <div className="w-6 h-6 rounded-md bg-slate-50 dark:bg-white/5" />
                         </div>
                      </div>

                      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-gradient-to-br from-white/0 to-white/40 dark:to-white/5 rounded-full blur-2xl group-hover:blur-3xl transition-all" />
                   </div>
                </Card>
             </motion.div>
           ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 p-12 rounded-[3rem] bg-brand-blue dark:bg-brand-purple flex flex-col md:flex-row items-center justify-between gap-12 text-white"
        >
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center">
                 <LayoutPanelLeft size={32} />
              </div>
              <div>
                 <div className="text-3xl font-black">40+ Leçons</div>
                 <div className="text-brand-blue-100 opacity-70">Contenu exclusif TEF IRN</div>
              </div>
           </div>

           <div className="w-px h-16 bg-white/20 hidden md:block" />

           <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center">
                 <LineChart size={32} />
              </div>
              <div>
                 <div className="text-3xl font-black">Progression IA</div>
                 <div className="text-brand-blue-100 opacity-70">Analyse de vos points faibles</div>
              </div>
           </div>

           <div className="w-px h-16 bg-white/20 hidden md:block" />

           <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center">
                 <Zap size={32} />
              </div>
              <div>
                 <div className="text-3xl font-black">Zéro Attente</div>
                 <div className="text-brand-blue-100 opacity-70">Correction instantanée</div>
              </div>
           </div>
        </motion.div>
      </div>
    </section>
  );
}
