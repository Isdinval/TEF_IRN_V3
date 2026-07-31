"use client";

import React from "react";
import { motion } from "framer-motion";
import { XCircle, CheckCircle2, AlertCircle, MessageSquare, Headphones, Zap } from "lucide-react";

export function ProblemSolution() {
  return (
    <section className="py-32 px-6 bg-indigo-50 dark:bg-indigo-950 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-black uppercase tracking-wider mb-6"
          >
            <AlertCircle size={12} />
            <span>Le piège de l&apos;examen</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black mb-8 leading-tight text-slate-900 dark:text-white"
          >
            Le parcours de naturalisation, <br />
            <span className="text-brand-blue dark:text-brand-gold">ce n&apos;est pas qu&apos;un QCM.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium"
          >
            L&apos;Examen Civique et le TEF IRN sont deux épreuves distinctes, préparées séparément par la plupart des candidats.
            Sans entraînement guidé à l&apos;oral et à l&apos;écrit, vous risquez de rater 50% de la note du TEF IRN.
          </motion.p>
        </div>

        <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/5">
          <div className="flex flex-col md:flex-row">
             <motion.div
               initial={{ opacity: 0, x: -30 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.6 }}
               className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center gap-8 bg-white dark:bg-slate-800"
             >
                <div className="space-y-4">
                   <h3 className="text-3xl font-black text-slate-400">Méthodes Classiques</h3>
                   <p className="text-slate-400 font-medium italic">&quot;Deux démarches séparées, sans lien entre elles.&quot;</p>
                </div>
                <div className="space-y-6">
                   {[
                     { icon: <XCircle className="text-red-400" />, text: "Examen Civique et TEF IRN préparés à part" },
                     { icon: <XCircle className="text-red-400" />, text: "Aucune correction d'expression écrite/orale" },
                     { icon: <XCircle className="text-red-400" />, text: "Pas de pratique orale réelle" }
                   ].map((item, i) => (
                     <div key={i} className="flex items-center gap-4 text-slate-400">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                           {item.icon}
                        </div>
                        <span className="font-bold">{item.text}</span>
                     </div>
                   ))}
                </div>
             </motion.div>

             <motion.div
               initial={{ opacity: 0, x: 30 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.6, delay: 0.15 }}
               className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center gap-8 bg-gradient-to-br from-brand-blue to-brand-purple text-white"
             >
                <div className="space-y-4">
                   <h3 className="text-3xl font-black">L&apos;Expérience LlamaKusi</h3>
                   <p className="text-brand-blue-100 font-medium italic text-indigo-100">&quot;Un seul parcours guidé, du QCM civique jusqu&apos;à l&apos;oral du TEF.&quot;</p>
                </div>
                <div className="space-y-6">
                   {[
                     { icon: <MessageSquare />, text: "Correction IA instantanée à l'écrit et à l'oral" },
                     { icon: <Headphones />, text: "Entraînement disponible 24/7" },
                     { icon: <CheckCircle2 className="text-brand-gold" />, text: "Un seul tableau de bord pour les deux épreuves" }
                   ].map((item, i) => (
                     <div key={i} className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                           {item.icon}
                        </div>
                        <span className="font-bold">{item.text}</span>
                     </div>
                   ))}
                </div>
             </motion.div>
          </div>

          <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
             <div className="w-16 h-16 rounded-full bg-brand-gold flex items-center justify-center shadow-2xl text-brand-dark">
                <Zap size={32} fill="currentColor" />
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
