"use client";

import React from "react";
import { motion } from "framer-motion";
import { ClipboardList, Sparkles, GraduationCap, ArrowRight } from "lucide-react";

const steps = [
  {
    title: "Positionnement",
    desc: "Évaluez votre niveau actuel (A1-B2) en 15 minutes avec notre test initial gratuit.",
    icon: <ClipboardList size={32} />,
    color: "bg-brand-blue"
  },
  {
    title: "Entraînement Immersif",
    desc: "Pratiquez l'écrit et l'oral avec LlamaKuzy. Recevez des corrections instantanées et bienveillantes.",
    icon: <Sparkles size={32} />,
    color: "bg-brand-purple"
  },
  {
    title: "Validation & Réussite",
    desc: "Simulez l'examen réel, obtenez votre projection de score et partez confiant le jour J.",
    icon: <GraduationCap size={32} />,
    color: "bg-brand-gold"
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 px-6 bg-slate-50 dark:bg-white/[0.02]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight text-slate-900 dark:text-white">
            Votre chemin vers le <br />
            <span className="text-brand-blue">succès en 3 étapes.</span>
          </h2>
          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
            Une méthode prouvée, simplifiée et boostée par l'IA pour maximiser vos chances.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connecting Lines (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-white/5 -translate-y-1/2 z-0" />

          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div className={`w-24 h-24 rounded-[2rem] ${step.color} text-white flex items-center justify-center shadow-2xl mb-8 group-hover:scale-110 transition-transform duration-500`}>
                {step.icon}
              </div>
              <h3 className="text-2xl font-black mb-4 text-slate-900 dark:text-white">{step.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed px-4">
                {step.desc}
              </p>

              {i < steps.length - 1 && (
                <div className="mt-8 md:hidden text-slate-300">
                  <ArrowRight className="rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
