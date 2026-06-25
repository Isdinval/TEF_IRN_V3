"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    question: "L'IA est-elle vraiment fiable pour corriger le TEF ?",
    answer: "Oui, notre modèle est spécifiquement entraîné sur les grilles d'évaluation officielles de la CCI. Il détecte non seulement les erreurs de grammaire, mais évalue aussi la richesse lexicale et la pertinence argumentative, exactement comme un correcteur humain."
  },
  {
    question: "Combien de temps faut-il pour se préparer ?",
    answer: "Cela dépend de votre niveau initial. En moyenne, nos utilisateurs atteignent le niveau B1 en 6 semaines avec une pratique de 20 minutes par jour. Le mode 'Express' permet de se préparer intensivement en 2 semaines."
  },
  {
    question: "Est-ce que LlamaKusi couvre les 4 épreuves du TEF IRN ?",
    answer: "Absolument. Nous couvrons la Compréhension Orale, la Compréhension Écrite, l'Expression Orale (avec feedback audio) et l'Expression Écrite (avec correction détaillée). C'est la seule plateforme complète du marché."
  },
  {
    question: "Puis-je annuler mon abonnement Premium à tout moment ?",
    answer: "Bien sûr. L'abonnement est sans engagement pour le forfait mensuel. Vous pouvez annuler en un clic depuis vos paramètres. Vous garderez l'accès Premium jusqu'à la fin de la période en cours."
  },
  {
    question: "Puis-je l'utiliser sur mon téléphone ?",
    answer: "Oui, LlamaKusi est 'Mobile-First'. Bien que ce ne soit pas une application à télécharger sur l'App Store, le site est optimisé pour fonctionner parfaitement sur tous les navigateurs mobiles (iOS et Android)."
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
