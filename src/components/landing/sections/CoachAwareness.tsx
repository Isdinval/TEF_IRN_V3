"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, BookOpen, Sparkles, PenTool, Mic2 } from "lucide-react";

// Avatar réel du produit (mêmes assets que ChatCoach.tsx / grammar-check-images.ts),
// pour que ce mockup soit visuellement fidèle au vrai Assistant LlamaKusi.
const MASCOT_URL = "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/grammar-check/neutre_1_transparent.webp";

// Les 4 scénarios repris tels quels de la logique réelle de l'Assistant LlamaKusi :
// - "context" reflète ce que décrit describePageContext() côté backend (api/coach/chat/route.ts)
// - "question" et "nextSuggestion" reprennent le texte exact des chips générées par
//   getContextualSuggestions() (ChatCoach.tsx) — la 1ʳᵉ chip devient la question simulée,
//   la 2ᵉ reste affichée comme suggestion suivante, comme dans le vrai composant.
const SCENARIOS = [
  {
    key: "lesson",
    badge: "Sur une leçon",
    icon: BookOpen,
    context: "Leçon « Les pronoms relatifs » · Niveau B1",
    question: "Explique-moi « Les pronoms relatifs »",
    reply:
      "Sur cette leçon, les pronoms relatifs les plus utiles au TEF IRN sont qui, que et où. On reprend un exemple ensemble ?",
    nextSuggestion: "Donne-moi un exemple",
  },
  {
    key: "parcours",
    badge: "Sur un parcours",
    icon: Sparkles,
    context: "Parcours « Conjugaison présent » · A1 · 4/10 leçons (40%)",
    question: "Quel est mon prochain exercice ?",
    reply:
      "Tu es à 40% du parcours. Vu tes dernières erreurs sur les verbes du 3ᵉ groupe, je te propose de continuer par là.",
    nextSuggestion: "Mes points faibles ici",
  },
  {
    key: "writing",
    badge: "En rédaction",
    icon: PenTool,
    context: "Sujet : « Informez un(e) ami(e) du changement d'horaires… »",
    question: "Conseils pour ce sujet",
    reply:
      "Pour ce type de message informel, structure en 3 temps : l'info, le contexte, une proposition. Je corrige ton brouillon dès que tu veux.",
    nextSuggestion: "Vocabulaire utile",
  },
  {
    key: "oral",
    badge: "À l'oral",
    icon: Mic2,
    context: "Scénario « Réserver une salle de sport » · B1",
    question: "Aide-moi à préparer ce scénario",
    reply:
      "Pense à demander les horaires ET le tarif — ce sont souvent les deux infos attendues dans ce type de scénario oral.",
    nextSuggestion: "Phrases utiles",
  },
] as const;

export function CoachAwareness() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SCENARIOS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const scenario = SCENARIOS[index];

  return (
    <section className="py-32 px-6 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Colonne texte — 1ère dans le DOM (ordre mobile : texte puis chat), à droite en desktop */}
        <div className="lg:order-2 text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-xs font-black uppercase tracking-wider mb-6"
          >
            <MapPin size={12} />
            <span>Toujours au bon endroit, au bon moment</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight text-slate-900 dark:text-white mb-6"
          >
            Pas un chatbot générique. <br />
            <span className="text-brand-blue dark:text-brand-gold">Assistant LlamaKusi vous suit, page après page.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed"
          >
            Sur une leçon, un parcours, un exercice de rédaction ou une simulation orale, Assistant LlamaKusi sait exactement où vous en êtes et adapte ses réponses en conséquence — sans jamais avoir à lui réexpliquer votre situation.
          </motion.p>
        </div>

        {/* Colonne chat animé — 2ᵉ dans le DOM (ordre mobile : après le texte), à gauche en desktop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="lg:order-1 max-w-lg mx-auto lg:mx-0 w-full"
        >
          {/* Bandeau "page consultée" — change selon le scénario, façon barre de contexte */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`page-${scenario.key}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-2.5 px-4 py-2.5 mb-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10"
            >
              <scenario.icon size={15} className="text-indigo-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500 leading-none mb-0.5">{scenario.badge}</p>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{scenario.context}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Mini fenêtre de chat — reproduction fidèle du vrai ChatCoach.tsx */}
          <div className="rounded-[2rem] overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 shadow-xl">
            {/* En-tête, identique au vrai composant */}
            <div className="flex items-center gap-3 px-4 py-3 bg-indigo-600">
              <div className="bg-white/20 rounded-xl w-9 h-9 overflow-hidden shrink-0">
                <img src={MASCOT_URL} alt="" className="w-full h-full object-contain object-bottom" />
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">Assistant LlamaKusi</p>
                <p className="text-[9px] text-indigo-100 uppercase tracking-widest font-bold">En ligne</p>
              </div>
            </div>

            {/* Échange — bulle question puis bulle réponse, mêmes couleurs que le vrai chat */}
            <AnimatePresence mode="wait">
              <motion.div
                key={scenario.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5 }}
                className="p-4 md:p-5 space-y-3 min-h-[190px]"
              >
                <div className="flex justify-end">
                  <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-none px-4 py-2.5 text-sm font-medium max-w-[85%] shadow-sm">
                    {scenario.question}
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white text-zinc-800 border border-zinc-200 rounded-2xl rounded-tl-none px-4 py-2.5 text-sm font-medium max-w-[85%] shadow-sm">
                    {scenario.reply}
                  </div>
                </div>
                <div className="flex justify-start pt-1">
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-zinc-500">
                    {scenario.nextSuggestion}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Indicateur du cycle en cours (décoratif, non cliquable) */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {SCENARIOS.map((s, i) => (
              <div
                key={s.key}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-8 bg-indigo-500" : "w-1.5 bg-slate-300 dark:bg-white/20"}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
