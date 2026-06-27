"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    question: "Pourquoi 55€/mois alors que d'autres apps sont moins chères ?",
    answer: "Parce qu'aucune autre app ne propose de coach IA générative sur l'Expression Écrite et l'Expression Orale — les deux épreuves les plus discriminantes du TEF IRN. Une formation traditionnelle coûte 300 à 800 €+ pour une préparation complète : LlamaKusi offre un entraînement illimité 24/7 pour 5 à 14 fois moins cher."
  },
  {
    question: "Je travaille en journée, est-ce que ça marche pour moi ?",
    answer: "C'est exactement pour ça que LlamaKusi existe. Le coach IA est disponible 24h/24 — vous pouvez vous entraîner à 21h30 après le travail, ou le week-end, en sessions de 15 à 40 minutes. Aucun horaire fixe, aucun cours à rattraper."
  },
  {
    question: "Mon niveau est encore faible (A1/A2), c'est pour moi ?",
    answer: "Oui. Le parcours adaptatif couvre A1 à B2 et s'ajuste à votre niveau réel sur chaque compétence. Beaucoup de candidats sont hétérogènes (oral fluide, écrit faible, ou l'inverse) — LlamaKusi cible précisément vos lacunes plutôt que de vous faire repasser un programme générique."
  },
  {
    question: "L'IA est-elle vraiment fiable pour corriger le TEF ?",
    answer: "Le Coach Écrit utilise GPT-4o avec des prompts spécialisés sur les critères CECRL et les grilles d'évaluation du TEF IRN : grammaire, vocabulaire, structure et cohérence. Le Coach Oral utilise l'API Realtime d'OpenAI pour évaluer prononciation et fluidité en conversation réelle."
  },
  {
    question: "Le TEF IRN est-il éligible au CPF avec LlamaKusi ?",
    answer: "Le TEF IRN est éligible au CPF depuis octobre 2024. LlamaKusi est en cours de certification Qualiopi pour pouvoir être financé via vos droits CPF — en attendant, l'abonnement reste 5 à 14 fois moins cher qu'une formation traditionnelle."
  },
  {
    question: "Puis-je annuler à tout moment ?",
    answer: "Oui. L'essai de 7 jours est gratuit, et l'abonnement est sans engagement : vous pouvez annuler en un clic depuis vos paramètres et gardez l'accès jusqu'à la fin de la période en cours."
  }
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-32 px-6 bg-slate-50 dark:bg-slate-900/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-20">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-xs font-black uppercase tracking-wider mb-6">
             <HelpCircle size={12} />
             <span>Des réponses à vos questions</span>
           </div>
           <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight text-slate-900 dark:text-white">
             Questions <br />
             <span className="text-brand-blue">fréquentes.</span>
           </h2>
        </div>

        <div className="space-y-4">
           {faqs.map((faq, i) => {
             const isOpen = openIndex === i;
             return (
               <div
                 key={i}
                 className={`rounded-3xl border transition-all duration-300 ${isOpen ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 shadow-xl' : 'bg-transparent border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'}`}
               >
                 <button
                   onClick={() => setOpenIndex(isOpen ? null : i)}
                   className="w-full p-8 flex items-center justify-between text-left gap-4"
                 >
                   <span className="text-lg md:text-xl font-black text-slate-900 dark:text-white">{faq.question}</span>
                   <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-brand-blue text-white rotate-180' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
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
                       <div className="px-8 pb-8 text-slate-500 dark:text-slate-400 font-medium leading-relaxed md:text-lg">
                          {faq.answer}
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
             );
           })}
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
