"use client";

import React from "react";
import { motion } from "framer-motion";
import { PenTool, Mic2, Headphones, GraduationCap, ClipboardCheck, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    number: "01",
    title: "Coach Expression Écrite",
    desc: "Rédigez sur des sujets officiels Section A et B. Chaque erreur est corrigée et expliquée, pas juste signalée.",
    icon: <PenTool size={26} />,
    accent: "blue",
    delay: 0.1,
    track: "Coach TEF IRN",
    points: [
      "Sujets calqués sur le format réel (Section A/B, timer, compteur de mots)",
      "Score global + détail par compétence (grammaire, vocabulaire, cohérence, orthographe)",
      "Chaque correction expliquée en détail, pour comprendre et ne plus refaire l'erreur",
    ],
  },
  {
    number: "02",
    title: "Coach Expression Orale",
    desc: "Entraînez-vous à l'oral face à un examinateur virtuel, sans stress et sans jugement.",
    icon: <Mic2 size={26} />,
    accent: "purple",
    delay: 0.2,
    track: "Coach TEF IRN",
    points: [
      "Simulation des deux sections orales (obtenir des informations, convaincre)",
      "Feedback sur la prononciation, la fluidité et la pertinence des réponses",
      "Disponible 24/7, en sessions de quelques minutes",
    ],
  },
  {
    number: "03",
    title: "Compréhension Écrite & Orale",
    desc: "Des exercices qui s'ajustent à votre niveau réel pour progresser sur les deux épreuves de compréhension.",
    icon: <Headphones size={26} />,
    accent: "amber",
    delay: 0.3,
    track: "Coach TEF IRN",
    points: [
      "Parcours adaptatif de A1 à B2, ajusté à votre progression",
      "LlamaKusi cible précisément vos lacunes plutôt qu'un programme générique",
      "Formats d'exercices identiques à ceux de l'examen",
    ],
  },
  {
    number: "04",
    title: "Entraînement Examen Civique",
    desc: "QCM sur l'histoire, les valeurs et les institutions françaises — gratuit, sans carte bancaire.",
    icon: <GraduationCap size={26} />,
    accent: "emerald",
    delay: 0.4,
    track: "Coach Examen Civique",
    points: [
      "Questions issues du référentiel officiel du Ministère de l'Intérieur",
      "Feedback immédiat sur chaque réponse, avec explication",
      "Fiches de révision par thématique (institutions, valeurs, histoire)",
    ],
  },
];

// Classes Tailwind statiques (pas de construction dynamique de nom de classe, pour que le JIT les détecte)
const ACCENT_STYLES: Record<string, { bar: string; iconBg: string; iconGlow: string; ghost: string; check: string }> = {
  blue: {
    bar: "from-blue-500 to-blue-400",
    iconBg: "bg-blue-500",
    iconGlow: "shadow-blue-500/30",
    ghost: "text-blue-500/10 dark:text-blue-400/10",
    check: "text-blue-500",
  },
  purple: {
    bar: "from-purple-500 to-purple-400",
    iconBg: "bg-purple-500",
    iconGlow: "shadow-purple-500/30",
    ghost: "text-purple-500/10 dark:text-purple-400/10",
    check: "text-purple-500",
  },
  amber: {
    bar: "from-amber-500 to-amber-400",
    iconBg: "bg-amber-500",
    iconGlow: "shadow-amber-500/30",
    ghost: "text-amber-500/10 dark:text-amber-400/10",
    check: "text-amber-500",
  },
  emerald: {
    bar: "from-emerald-500 to-emerald-400",
    iconBg: "bg-emerald-500",
    iconGlow: "shadow-emerald-500/30",
    ghost: "text-emerald-500/10 dark:text-emerald-400/10",
    check: "text-emerald-500",
  },
};

export function Features() {
  return (
    <section id="features" className="py-32 px-6 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/10 dark:bg-white/10 border border-brand-blue/20 dark:border-white/10 text-brand-blue dark:text-brand-gold text-xs font-black uppercase tracking-wider mb-6">
              <Sparkles size={12} />
              <span>Un parcours, deux étapes</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black leading-tight text-slate-900 dark:text-white">
              Ce que LlamaKusi <br />
              <span className="text-brand-blue dark:text-brand-gold">fait vraiment pour vous.</span>
            </h2>
          </div>
          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-md font-medium leading-relaxed">
            Un coach IA dédié à chaque compétence évaluée, du QCM civique jusqu'à l'oral du TEF IRN.
          </p>
        </div>

        {/* Le parcours en 2 étapes — repensé comme un vrai mini-parcours visuel */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-200 dark:border-emerald-500/20 shadow-sm">
            <span className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-base shrink-0">1</span>
            <div className="text-left">
              <p className="font-black text-emerald-700 dark:text-emerald-400 leading-tight">Examen Civique</p>
              <p className="text-[10px] font-black text-emerald-600/70 dark:text-emerald-400/60 uppercase tracking-widest">Gratuit</p>
            </div>
          </div>
          <ArrowRight size={22} className="text-slate-300 dark:text-slate-600 rotate-90 sm:rotate-0 shrink-0" />
          <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-brand-blue/5 dark:bg-brand-gold/10 border-2 border-brand-blue/20 dark:border-brand-gold/20 shadow-sm">
            <span className="w-10 h-10 rounded-full bg-brand-blue dark:bg-brand-gold text-white dark:text-brand-dark flex items-center justify-center font-black text-base shrink-0">2</span>
            <div className="text-left">
              <p className="font-black text-brand-blue dark:text-brand-gold leading-tight">Coach TEF IRN</p>
              <p className="text-[10px] font-black text-brand-blue/70 dark:text-brand-gold/70 uppercase tracking-widest">Premium</p>
            </div>
          </div>
        </div>

        {/* Features Grid — plus engageant : numéro fantôme, barre d'accent, icône glow, puces colorées */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((f, i) => {
            const accent = ACCENT_STYLES[f.accent];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: f.delay }}
              >
                <Card className="group relative h-full rounded-[2.5rem] border-none bg-slate-50 dark:bg-white/5 p-10 overflow-hidden hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
                  {/* Barre d'accent en haut */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${accent.bar}`} />
                  {/* Numéro fantôme en fond */}
                  <span className={`absolute -top-2 right-6 text-[7rem] font-black leading-none select-none ${accent.ghost}`}>
                    {f.number}
                  </span>

                  <div className="relative flex items-center gap-3 mb-8">
                    <div className={`w-16 h-16 rounded-2xl ${accent.iconBg} flex items-center justify-center text-white shadow-xl ${accent.iconGlow} transition-transform duration-300 group-hover:scale-110`}>
                      {f.icon}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${f.accent === "emerald" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-brand-blue/10 text-brand-blue dark:text-brand-gold"}`}>
                      {f.track}
                    </span>
                  </div>

                  <h3 className="relative text-2xl font-black mb-3 text-slate-900 dark:text-white">{f.title}</h3>
                  <p className="relative text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-8">
                    {f.desc}
                  </p>

                  <ul className="relative space-y-3">
                    {f.points.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                        <CheckCircle2 size={16} className={`${accent.check} mt-0.5 shrink-0`} />
                        {point}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Examens blancs — information mise en avant séparément (TEF IRN + Examen Civique) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-8 rounded-[2.5rem] p-10 md:p-12 bg-gradient-to-br from-brand-blue to-brand-purple text-white flex flex-col md:flex-row items-start md:items-center gap-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-xl flex items-center justify-center shrink-0">
            <ClipboardCheck size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-black mb-2">Examens blancs en conditions réelles</h3>
            <p className="text-indigo-100 font-medium leading-relaxed max-w-3xl">
              Simulateur chronométré pour le TEF IRN (CE, CO, EE, EO) comme pour l&apos;Examen Civique (40 questions, 45 minutes) — pour arriver le jour J sans surprise, avec un score estimé fiable.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
