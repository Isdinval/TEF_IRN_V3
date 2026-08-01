"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Tag = "tef-irn" | "civique" | "general";

const TAG_LABELS: Record<Tag, string> = {
  "tef-irn": "TEF IRN",
  civique: "Examen Civique",
  general: "Général",
};

const TAG_STYLES: Record<Tag, string> = {
  "tef-irn": "bg-brand-blue/10 text-brand-blue dark:bg-brand-gold/10 dark:text-brand-gold",
  civique: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  general: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

const faqs: { question: string; answer: string; tag: Tag }[] = [
  {
    question: "Pourquoi 54,90€/mois alors que d'autres apps sont moins chères ?",
    answer: "Parce qu'aucune autre app ne propose de coach IA sur l'Expression Écrite et l'Expression Orale — les deux épreuves les plus discriminantes du TEF IRN. Une formation traditionnelle coûte 300 à 800 €+ pour une préparation complète : LlamaKusi offre un entraînement illimité 24/7 pour 5 à 14 fois moins cher.",
    tag: "tef-irn",
  },
  {
    question: "L'entraînement à l'Examen Civique est-il vraiment gratuit ?",
    answer: "Oui, entièrement et sans carte bancaire. L'entraînement, la révision par fiches et les examens blancs sur l'Examen Civique sont inclus dans tous les plans, y compris le plan Gratuit.",
    tag: "civique",
  },
  {
    question: "Combien de questions comporte l'Examen Civique, et quel est le seuil de réussite ?",
    answer: "L'examen comporte 40 questions à choix multiple sur l'histoire, les valeurs et les institutions françaises. Le seuil de réussite est de 32 bonnes réponses sur 40, en 45 minutes.",
    tag: "civique",
  },
  {
    question: "Dois-je préparer l'Examen Civique et le TEF IRN en même temps ?",
    answer: "Ce n'est pas obligatoire, mais c'est ce que nous recommandons : commencez par l'Examen Civique (gratuit, plus rapide à préparer), puis enchaînez avec le coach TEF IRN pour l'écrit et l'oral. Les deux parcours restent accessibles indépendamment depuis votre tableau de bord.",
    tag: "general",
  },
  {
    question: "Je travaille en journée, est-ce que ça marche pour moi ?",
    answer: "C'est exactement pour ça que LlamaKusi existe. Le coach IA est disponible 24h/24 — vous pouvez vous entraîner à 21h30 après le travail, ou le week-end, en sessions de 15 à 40 minutes. Aucun horaire fixe, aucun cours à rattraper.",
    tag: "general",
  },
  {
    question: "Mon niveau est encore faible (A1/A2), c'est pour moi ?",
    answer: "Oui. Le parcours adaptatif couvre A1 à B2 et s'ajuste à votre niveau réel sur chaque compétence. Beaucoup de candidats sont hétérogènes (oral fluide, écrit faible, ou l'inverse) — LlamaKusi cible précisément vos lacunes plutôt que de vous faire repasser un programme générique.",
    tag: "tef-irn",
  },
  {
    question: "L'IA est-elle vraiment fiable pour corriger le TEF ?",
    answer: "Le coach est calibré sur les critères officiels CECRL et les grilles d'évaluation du TEF IRN : grammaire, vocabulaire, structure et cohérence à l'écrit ; prononciation et fluidité à l'oral, évaluées en conversation réelle.",
    tag: "tef-irn",
  },
  {
    question: "Le TEF IRN est-il éligible au CPF avec LlamaKusi ?",
    answer: "Le TEF IRN est éligible au CPF depuis octobre 2024. LlamaKusi est en cours de certification Qualiopi pour pouvoir être financé via vos droits CPF — en attendant, l'abonnement reste 5 à 14 fois moins cher qu'une formation traditionnelle.",
    tag: "tef-irn",
  },
  {
    question: "Puis-je annuler à tout moment ?",
    answer: "Oui, l'abonnement est sans engagement : vous pouvez annuler en un clic depuis vos paramètres et gardez l'accès jusqu'à la fin de la période en cours.",
    tag: "general",
  },
];

const FILTERS: { value: "all" | Tag; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "tef-irn", label: "TEF IRN" },
  { value: "civique", label: "Examen Civique" },
  { value: "general", label: "Général" },
];

export function FAQ() {
  const [activeFilter, setActiveFilter] = useState<"all" | Tag>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = useMemo(
    () => (activeFilter === "all" ? faqs : faqs.filter((f) => f.tag === activeFilter)),
    [activeFilter]
  );

  return (
    <section id="faq" className="py-32 px-6 bg-white dark:bg-brand-dark">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-xs font-black uppercase tracking-wider mb-6">
             <HelpCircle size={12} />
             <span>Des réponses à vos questions</span>
           </div>
           <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight text-slate-900 dark:text-white">
             Questions <br />
             <span className="text-brand-blue dark:text-brand-gold">fréquentes.</span>
           </h2>
        </div>

        {/* Filtres par catégorie */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => { setActiveFilter(f.value); setOpenIndex(null); }}
                className={`px-5 py-2.5 rounded-full text-sm font-black transition-all ${
                  isActive
                    ? "bg-brand-blue dark:bg-brand-gold text-white dark:text-brand-dark shadow-lg"
                    : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-4">
           <AnimatePresence mode="popLayout">
             {filteredFaqs.map((faq, i) => {
               const isOpen = openIndex === i;
               return (
                 <motion.div
                   key={faq.question}
                   layout
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   transition={{ duration: 0.2 }}
                   className={`rounded-3xl border transition-all duration-300 ${isOpen ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 shadow-xl' : 'bg-transparent border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'}`}
                 >
                   <button
                     onClick={() => setOpenIndex(isOpen ? null : i)}
                     className="w-full p-6 md:p-8 flex items-center justify-between text-left gap-4"
                   >
                     <div className="flex flex-col gap-2">
                       <span className={`self-start text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${TAG_STYLES[faq.tag]}`}>
                         {TAG_LABELS[faq.tag]}
                       </span>
                       <span className="text-lg md:text-xl font-black text-slate-900 dark:text-white">{faq.question}</span>
                     </div>
                     <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-brand-blue dark:bg-brand-gold text-white dark:text-brand-dark rotate-180' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                        {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                     </div>
                   </button>

                   <AnimatePresence>
                     {isOpen && (
                       <motion.div
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: "auto", opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         transition={{ duration: 0.3 }}
                         className="overflow-hidden"
                       >
                         <div className="px-6 md:px-8 pb-8 text-slate-500 dark:text-slate-400 font-medium leading-relaxed md:text-lg">
                            {faq.answer}
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </motion.div>
               );
             })}
           </AnimatePresence>
        </div>

        <div className="mt-16 p-8 rounded-[2rem] bg-indigo-50 dark:bg-white/5 border border-indigo-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
           <div>
              <h4 className="font-black text-slate-900 dark:text-white mb-1">Vous avez encore des doutes ?</h4>
              <p className="text-sm text-slate-500 font-medium">Nos conseillers pédagogiques vous répondent en moins de 24h.</p>
           </div>
           <Button className="bg-brand-blue text-white font-black px-8 h-12 rounded-xl">
             Contacter le support
           </Button>
        </div>
      </div>
    </section>
  );
}
