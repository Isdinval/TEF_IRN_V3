"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, BookOpen, Sparkles, PenTool, Mic2 } from "lucide-react";

// Les 4 scénarios repris tels quels de la logique réelle du Coach LlamaKusi :
// - "context" reflète ce que décrit describePageContext() côté backend (api/coach/chat/route.ts)
// - "suggestions" reprend le texte exact des chips générées par getContextualSuggestions() (ChatCoach.tsx)
const SCENARIOS = [
  {
    key: "lesson",
    badge: "Sur une leçon",
    icon: BookOpen,
    context: "Leçon « Les pronoms relatifs » · Niveau B1",
    reply:
      "Sur cette leçon, les pronoms relatifs les plus utiles au TEF IRN sont qui, que et où. On reprend un exemple ensemble ?",
    suggestions: ["Explique-moi « Les pronoms relatifs »", "Donne-moi un exemple"],
  },
  {
    key: "parcours",
    badge: "Sur un parcours",
    icon: Sparkles,
    context: "Parcours « Conjugaison présent » · A1 · 4/10 leçons (40%)",
    reply:
      "Tu es à 40% du parcours. Vu tes dernières erreurs sur les verbes du 3ᵉ groupe, je te propose de continuer par là.",
    suggestions: ["Quel est mon prochain exercice ?", "Mes points faibles ici"],
  },
  {
    key: "writing",
    badge: "En rédaction",
    icon: PenTool,
    context: "Sujet : « Informez un(e) ami(e) du changement d'horaires… »",
    reply:
      "Pour ce type de message informel, structure en 3 temps : l'info, le contexte, une proposition. Je corrige ton brouillon dès que tu veux.",
    suggestions: ["Conseils pour ce sujet", "Vocabulaire utile"],
  },
  {
    key: "oral",
    badge: "À l'oral",
    icon: Mic2,
    context: "Scénario « Réserver une salle de sport » · B1",
    reply:
      "Pense à demander les horaires ET le tarif — ce sont souvent les deux infos attendues dans ce type de scénario oral.",
    suggestions: ["Aide-moi à préparer ce scénario", "Phrases utiles"],
  },
] as const;

export function CoachAwareness() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SCENARIOS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const scenario = SCENARIOS[index];

  return (
    <section className="py-32 px-6 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-xs font-black uppercase tracking-wider mb-6"
          >
            <MapPin size={12} />
            <span>Un coach qui sait où vous en êtes</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black leading-tight text-slate-900 dark:text-white mb-6"
          >
            Pas un chatbot générique. <br />
            <span className="text-brand-blue dark:text-brand-gold">Un coach qui vous suit, page après page.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed"
          >
            Sur une leçon, un parcours, un exercice de rédaction ou une simulation orale, le Coach LlamaKusi sait exactement où vous en êtes et adapte ses réponses en conséquence — sans jamais avoir à lui réexpliquer votre situation.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="max-w-4xl mx-auto rounded-[2.5rem] border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-6 md:p-10 overflow-hidden"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={scenario.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 md:gap-8 items-center"
            >
              {/* Contexte de la page consultée */}
              <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
                  <scenario.icon size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">{scenario.badge}</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-snug">{scenario.context}</p>
                </div>
              </div>

              {/* Réponse du coach + suggestions contextuelles réelles */}
              <div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none border border-slate-200 dark:border-white/10 shadow-sm p-5">
                  <p className="text-sm md:text-base text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                    {scenario.reply}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {scenario.suggestions.map((s) => (
                    <span
                      key={s}
                      className="text-xs font-bold px-3 py-1.5 rounded-full bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Indicateur du cycle en cours (décoratif, non cliquable) */}
          <div className="flex items-center justify-center gap-2 mt-8">
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
