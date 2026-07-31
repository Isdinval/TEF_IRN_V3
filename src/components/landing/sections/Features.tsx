"use client";

import React from "react";
import { motion } from "framer-motion";
import { PenTool, Mic2, Headphones, GraduationCap, ClipboardCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    title: "Coach Expression Écrite",
    desc: "Rédigez sur des sujets officiels Section A et B. Chaque erreur est corrigée et expliquée, pas juste signalée.",
    icon: <PenTool size={28} />,
    color: "bg-blue-500",
    delay: 0.1,
    track: "Coach TEF IRN",
    points: [
      "Sujets calqués sur le format réel (Section A/B, timer, compteur de mots)",
      "Score global + détail par compétence (grammaire, vocabulaire, cohérence, orthographe)",
      "Chaque correction expliquée en détail, pour comprendre et ne plus refaire l'erreur",
    ],
  },
  {
    title: "Coach Expression Orale",
    desc: "Entraînez-vous à l'oral face à un examinateur virtuel, sans stress et sans jugement.",
    icon: <Mic2 size={28} />,
    color: "bg-purple-500",
    delay: 0.2,
    track: "Coach TEF IRN",
    points: [
      "Simulation des deux sections orales (obtenir des informations, convaincre)",
      "Feedback sur la prononciation, la fluidité et la pertinence des réponses",
      "Disponible 24/7, en sessions de quelques minutes",
    ],
  },
  {
    title: "Compréhension Écrite & Orale",
    desc: "Des exercices qui s'ajustent à votre niveau réel pour progresser sur les deux épreuves de compréhension.",
    icon: <Headphones size={28} />,
    color: "bg-amber-500",
    delay: 0.3,
    track: "Coach TEF IRN",
    points: [
      "Parcours adaptatif de A1 à B2, ajusté à votre progression",
      "LlamaKusi cible précisément vos lacunes plutôt qu'un programme générique",
      "Formats d'exercices identiques à ceux de l'examen",
    ],
  },
  {
    title: "Entraînement Examen Civique",
    desc: "QCM sur l'histoire, les valeurs et les institutions françaises — gratuit, sans carte bancaire.",
    icon: <GraduationCap size={28} />,
    color: "bg-emerald-500",
    delay: 0.4,
    track: "Gratuit",
    points: [
      "Questions issues du référentiel officiel du Ministère de l'Intérieur",
      "Feedback immédiat sur chaque réponse, avec explication",
      "Fiches de révision par thématique (institutions, valeurs, histoire)",
    ],
  },
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
              Ce que LlamaKusi <br />
              <span className="text-slate-400 dark:text-slate-500">fait vraiment pour vous.</span>
            </h2>
          </div>
          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-md font-medium leading-relaxed">
            Un coach IA dédié à chaque compétence évaluée, du QCM civique jusqu'à l'oral du TEF IRN.
          </p>
        </div>

        {/* Bandeau du parcours */}
        <div className="flex items-center justify-center gap-3 mb-16 text-sm font-black">
          <span className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">1. Examen Civique — Gratuit</span>
          <span className="text-slate-300 dark:text-slate-600">→</span>
          <span className="px-4 py-2 rounded-full bg-brand-blue/10 text-brand-blue dark:text-brand-gold border border-brand-blue/20 dark:border-brand-gold/20">2. Coach TEF IRN — Premium</span>
        </div>

        {/* Features Grid — explications, sans animation ni mockup */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: f.delay }}
            >
              <Card className="h-full rounded-[2.5rem] border-none bg-slate-50 dark:bg-white/5 p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className={`w-14 h-14 rounded-2xl ${f.color} flex items-center justify-center text-white shadow-xl`}>
                    {f.icon}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${f.track === "Gratuit" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-brand-blue/10 text-brand-blue dark:text-brand-gold"}`}>
                    {f.track}
                  </span>
                </div>

                <h3 className="text-2xl font-black mb-4 text-slate-900 dark:text-white">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-8">
                  {f.desc}
                </p>

                <ul className="space-y-3">
                  {f.points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                      <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          ))}
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
