"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { XCircle, CheckCircle2, AlertCircle, MessageSquare, Headphones, Zap } from "lucide-react";

export function ProblemSolution() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const x = useTransform(scrollYProgress, [0.3, 0.6], ["0%", "-50%"]);

  return (
    <section ref={containerRef} className="py-32 px-6 bg-slate-50 dark:bg-slate-900/30 overflow-hidden">
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
            L&apos;examen TEF IRN, <br />
            <span className="text-brand-blue dark:text-brand-gold">ce n&apos;est pas que du QCM.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium"
          >
            Les méthodes traditionnelles oublient l&apos;essentiel : l&apos;expression.
            Sans entraînement à l&apos;oral et à l&apos;écrit, vous risquez de rater 50% de votre note.
          </motion.p>
        </div>

        <div className="relative h-[600px] rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/5">
          <div className="absolute inset-0 flex">
             <div className="w-1/2 h-full p-8 md:p-16 flex flex-col justify-center gap-8 bg-white dark:bg-slate-800">
                <div className="space-y-4">
                   <h3 className="text-3xl font-black text-slate-400">Méthodes Classiques</h3>
                   <p className="text-slate-400 font-medium italic">&quot;Des PDFs froids et des QCM répétitifs.&quot;</p>
                </div>
                <div className="space-y-6">
                   {[
                     { icon: <XCircle className="text-red-400" />, text: "Aucune correction d'expression" },
                     { icon: <XCircle className="text-red-400" />, text: "Pas de pratique orale réelle" },
                     { icon: <XCircle className="text-red-400" />, text: "Contenu statique et ennuyeux" }
                   ].map((item, i) => (
                     <div key={i} className="flex items-center gap-4 text-slate-400">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                           {item.icon}
                        </div>
                        <span className="font-bold">{item.text}</span>
                     </div>
                   ))}
                </div>
             </div>

             <div className="w-1/2 h-full p-8 md:p-16 flex flex-col justify-center gap-8 bg-gradient-to-br from-brand-blue to-brand-purple text-white">
                <div className="space-y-4">
                   <h3 className="text-3xl font-black">L&apos;Expérience Maîtris</h3>
                   <p className="text-brand-blue-100 font-medium italic text-indigo-100">&quot;L&apos;IA vous corrige en temps réel, comme un prof.&quot;</p>
                </div>
                <div className="space-y-6">
                   {[
                     { icon: <MessageSquare />, text: "Correction IA instantanée" },
                     { icon: <Headphones />, text: "Entraînement oral 24/7" },
                     { icon: <CheckCircle2 className="text-brand-gold" />, text: "Parcours 100% personnalisé" }
                   ].map((item, i) => (
                     <div key={i} className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                           {item.icon}
                        </div>
                        <span className="font-bold">{item.text}</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          <motion.div
            className="absolute inset-y-0 left-0 bg-white dark:bg-brand-dark z-10 border-r-4 border-brand-gold shadow-[10px_0_50px_rgba(212,175,55,0.3)]"
            style={{ width: "50%", x }}
          />

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
             <div className="w-16 h-16 rounded-full bg-brand-gold flex items-center justify-center shadow-2xl text-brand-dark">
                <Zap size={32} fill="currentColor" />
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
