"use client";

import React from "react";
import { motion } from "framer-motion";
import { PenTool, Mic2, BrainCircuit, Headphones, GraduationCap, Sparkles, LayoutPanelLeft, LineChart, Zap, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    title: "Coach Expression Écrite",
    desc: "Votre texte est corrigé phrase par phrase, avec une note estimée et une explication claire de chaque erreur — pas juste un score brut.",
    icon: <PenTool size={32} />,
    color: "bg-blue-500",
    delay: 0.1,
    type: "writing",
    track: "Coach TEF IRN"
  },
  {
    title: "Coach Oral",
    desc: "Entraînez-vous à parler sans stress, face à un examinateur virtuel. Feedback immédiat sur la prononciation et la fluidité.",
    icon: <Mic2 size={32} />,
    color: "bg-purple-500",
    delay: 0.2,
    type: "oral",
    track: "Coach TEF IRN"
  },
  {
    title: "Compréhension Écrite & Orale",
    desc: "Des exercices qui s'ajustent à votre niveau réel (A1 à B2), pour progresser sur les deux épreuves de compréhension sans perdre de temps.",
    icon: <Headphones size={32} />,
    color: "bg-amber-500",
    delay: 0.3,
    type: "practice",
    track: "Coach TEF IRN"
  },
  {
    title: "Entraînement Examen Civique",
    desc: "QCM sur l'histoire, les valeurs et les institutions françaises, avec feedback immédiat et fiches de révision. Gratuit, sans carte bancaire.",
    icon: <GraduationCap size={32} />,
    color: "bg-emerald-500",
    delay: 0.4,
    type: "civic",
    track: "Gratuit"
  }
];

export function Features() {
  return (
    <section id="features" className="py-32 px-6 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/10 dark:bg-white/10 border border-brand-blue/20 dark:border-white/10 text-brand-blue dark:text-brand-gold text-xs font-black uppercase tracking-wider mb-6">
              <Sparkles size={12} />
              <span>Un parcours, deux étapes</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black leading-tight text-slate-900 dark:text-white">
              Un coach IA sur <br />
              <span className="text-slate-400 dark:text-slate-500">les 4 épreuves du TEF IRN.</span>
            </h2>
          </div>
          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-md font-medium leading-relaxed">
            Aucun autre acteur ne couvre l'Expression Écrite, l'Expression Orale <em>et</em> la Compréhension avec un coach IA — en plus de l'Examen Civique, gratuit.
          </p>
        </div>

        {/* Bandeau du parcours */}
        <div className="flex items-center justify-center gap-3 mb-16 text-sm font-black">
          <span className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">1. Examen Civique — Gratuit</span>
          <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
          <span className="px-4 py-2 rounded-full bg-brand-blue/10 text-brand-blue dark:text-brand-gold border border-brand-blue/20 dark:border-brand-gold/20">2. Coach TEF IRN — Premium</span>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: f.delay }}
            >
              <Card className="group relative h-full rounded-[2.5rem] border-none bg-slate-50 dark:bg-white/5 p-10 overflow-hidden hover:translate-y-[-12px] transition-all duration-700">
                <div className="flex items-center justify-between mb-10">
                  <div className={`w-16 h-16 rounded-2xl ${f.color} flex items-center justify-center text-white shadow-xl transition-transform group-hover:scale-110 duration-500`}>
                    {f.icon}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${f.track === "Gratuit" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-brand-blue/10 text-brand-blue dark:text-brand-gold"}`}>
                    {f.track}
                  </span>
                </div>

                <h3 className="text-2xl font-black mb-6 text-slate-900 dark:text-white">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-12">
                  {f.desc}
                </p>

                {/* Démo animée */}
                <div className="relative mt-auto pt-8">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950">
                    <FeatureDemo type={f.type} />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Stats améliorées */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-20 p-12 rounded-[3rem] bg-gradient-to-br from-brand-blue to-brand-purple flex flex-col md:flex-row items-center justify-between gap-12 text-white"
        >
          <StatItem 
            icon={<LayoutPanelLeft size={32} />} 
            title="40+ Leçons" 
            subtitle="Contenu exclusif TEF IRN" 
          />
          <StatItem 
            icon={<BrainCircuit size={32} />} 
            title="2200+ Exercices" 
            subtitle="QCM, trous & adaptés" 
          />
          <StatItem 
            icon={<LineChart size={32} />} 
            title="Progression IA" 
            subtitle="Analyse de vos points faibles" 
          />
          <StatItem 
            icon={<Zap size={32} />} 
            title="Zéro Attente" 
            subtitle="Correction instantanée" 
          />
        </motion.div>
      </div>
    </section>
  );
}

// === Animations premium par fonctionnalité === (inchangées)
function FeatureDemo({ type }: { type: string }) {
  if (type === "writing") {
    return (
      <div className="relative w-full h-full p-8 flex flex-col justify-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.7, 1] }}
          transition={{ duration: 2.2, repeat: Infinity }}
          className="space-y-6"
        >
          <div className="text-emerald-400 font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> Correction en cours...
          </div>
          
          <div className="bg-white/10 p-4 rounded-2xl text-sm">
            <p className="line-through text-white/50">"Je suis aller à Paris hier."</p>
            <motion.p 
              initial={{ color: "#fff" }}
              animate={{ color: "#34d399" }}
              className="mt-3"
            >
              "Je suis allé à Paris hier."
            </motion.p>
          </div>

          <div className="flex justify-between text-xs">
            <div>Score Global : <span className="text-emerald-400 font-bold">94/100</span></div>
            <div className="text-emerald-400">3 corrections expliquées</div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (type === "oral") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/90 relative">
        <motion.div
          animate={{ 
            scale: [1, 1.25, 1],
            boxShadow: ["0 0 0 0 rgba(168, 85, 247, 0.4)", "0 0 0 25px rgba(168, 85, 247, 0)"]
          }}
          transition={{ duration: 2.2, repeat: Infinity }}
          className="w-24 h-24 rounded-full border-[6px] border-purple-500 flex items-center justify-center mb-8"
        >
          <Mic2 size={42} className="text-purple-400" />
        </motion.div>
        
        <p className="text-lg font-medium text-center">Prononciation analysée en direct</p>
        <div className="mt-3 flex gap-4 text-sm">
          <div>Fluidité <span className="text-purple-400 font-bold">96%</span></div>
          <div>Accent <span className="text-purple-400 font-bold">Excellent</span></div>
        </div>
      </div>
    );
  }

  if (type === "civic") {
    return (
      <div className="p-8 flex flex-col justify-center h-full text-white/90 space-y-5">
        <div className="text-center text-sm font-medium opacity-75">Question 12/40 — Institutions</div>
        <div className="bg-white/10 p-5 rounded-2xl border border-emerald-400/30">
          <p className="mb-4 text-sm">Qui est élu au suffrage universel direct en France ?</p>
          <div className="space-y-2 text-sm">
            {["Le Premier ministre", "Le Président de la République", "Le Préfet"].map((opt, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.02 }}
                className={`py-2.5 px-4 rounded-xl flex items-center justify-between ${idx === 1 ? "bg-emerald-500 text-white font-medium" : "bg-white/5"}`}
              >
                {opt}
                {idx === 1 && <span className="text-xs">✓ Bonne réponse</span>}
              </motion.div>
            ))}
          </div>
        </div>
        <div className="text-center text-xs text-emerald-400 font-bold">Seuil de réussite : 32/40</div>
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col justify-center h-full text-white/90 space-y-6">
      <div className="text-center text-sm font-medium opacity-75">Niveau adapté à votre profil</div>
      
      <motion.div 
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        className="bg-white/10 p-5 rounded-2xl border border-amber-400/30"
      >
        <p className="mb-4">Complétez : « Hier, je ___ à la bibliothèque. »</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {["vais", "suis allé", "allais", "allé"].map((opt, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className={`py-3 px-4 rounded-xl cursor-pointer transition-all ${idx === 1 ? 'bg-emerald-500 text-white font-medium' : 'bg-white/5 hover:bg-white/10'}`}
            >
              {opt}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function StatItem({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-6 group">
      <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center transition-transform group-hover:scale-110">
        {icon}
      </div>
      <div>
        <div className="text-3xl font-black tracking-tight">{title}</div>
        <div className="text-white/70 text-sm">{subtitle}</div>
      </div>
    </div>
  );
}
