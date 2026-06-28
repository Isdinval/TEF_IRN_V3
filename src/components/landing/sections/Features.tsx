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
    demo: "writing" // identifiant pour l'animation
  },
  {
    title: "Coaching Oral 24/7",
    desc: "Pratiquez l'expression orale sans stress. Notre IA analyse votre prononciation et votre fluidité sur tous les thèmes de l'examen.",
    icon: <Mic2 size={32} />,
    color: "bg-purple-500",
    delay: 0.2,
    demo: "oral"
  },
  {
    title: "Exercices Adaptatifs",
    desc: "QCM intelligents de niveau A1 à B2. La difficulté s'ajuste à votre progression réelle pour optimiser votre temps de travail.",
    icon: <BrainCircuit size={32} />,
    color: "bg-amber-500",
    delay: 0.3,
    demo: "practice"
  }
];

export function Features() {
  return (
    <section id="features" className="py-32 px-6 bg-slate-900 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-brand-gold text-xs font-black uppercase tracking-wider mb-6">
              <Sparkles size={12} />
              <span>Propulsé par GPT-4o</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black leading-tight text-white">
              La technologie au service <br />
              <span className="text-slate-500">de votre réussite.</span>
            </h2>
          </div>
          <p className="text-xl text-slate-400 max-w-md font-medium leading-relaxed">
            Plus qu'une plateforme, LlamaKusi est votre coach personnel qui vous accompagne jusqu'au jour de l'examen.
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
              <Card className="group relative h-full rounded-[2.5rem] border-none bg-white/5 p-10 overflow-hidden hover:translate-y-[-10px] transition-all duration-500">
                <div className={`w-16 h-16 rounded-2xl ${f.color} flex items-center justify-center text-white shadow-xl shadow-opacity-20 mb-10 transition-transform group-hover:scale-110`}>
                  {f.icon}
                </div>

                <h3 className="text-2xl font-black mb-6 text-white">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed font-medium mb-12">
                  {f.desc}
                </p>

                {/* === ZONE D'ANIMATION DÉMO === */}
                <div className="relative mt-auto pt-10">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950 flex items-center justify-center">
                    <FeatureDemo type={f.demo} />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Le reste du composant (stats) reste identique */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 p-12 rounded-[3rem] bg-brand-blue dark:bg-brand-purple flex flex-col md:flex-row items-center justify-between gap-12 text-white"
        >
          {/* ... (inchangé) */}
        </motion.div>
      </div>
    </section>
  );
}

// Composant d'animation selon le type
function FeatureDemo({ type }: { type: string }) {
  if (type === "writing") {
    return (
      <motion.div
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        className="w-full h-full p-8 flex flex-col justify-center text-white/90 text-sm font-mono"
      >
        <div className="mb-4 text-emerald-400">✓ Correction instantanée</div>
        <div className="line-through opacity-50">"Je vais à la plage hier."</div>
        <div className="text-emerald-400">"Je suis allé à la plage hier."</div>
        <div className="mt-6 text-xs opacity-70">Note estimée : 92/100 • 3 suggestions</div>
      </motion.div>
    );
  }

  if (type === "oral") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/90">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="w-20 h-20 rounded-full border-4 border-purple-500 flex items-center justify-center mb-6"
        >
          <Mic2 size={36} />
        </motion.div>
        <p className="text-center text-sm">Prononciation analysée en temps réel</p>
        <p className="text-xs opacity-60 mt-2">Fluidité : 94% • Accent : Excellent</p>
      </div>
    );
  }

  // Exercices adaptatifs
  return (
    <div className="w-full h-full p-8 flex flex-col justify-center gap-4 text-white/90">
      <motion.div
        animate={{ x: [-5, 5, -5] }}
        transition={{ duration: 1.2, repeat: Infinity }}
        className="bg-white/10 p-4 rounded-xl"
      >
        Choisissez la bonne réponse :
      </motion.div>
      <div className="space-y-3">
        {["Option A", "Option B ✓", "Option C"].map((opt, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: i === 1 ? 1 : 0.6 }}
            className={`p-3 rounded-xl text-sm ${i === 1 ? 'bg-emerald-500/30 border border-emerald-500' : 'bg-white/5'}`}
          >
            {opt}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
