"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, PlayCircle, Star, ShieldCheck, Sparkles } from "lucide-react";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VideoModal({ isOpen, onClose }: VideoModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-5xl bg-white dark:bg-brand-dark rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-10 p-2 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-5 h-full min-h-[500px]">
               <div className="lg:col-span-3 bg-slate-100 dark:bg-black/40 relative flex items-center justify-center overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/20 to-brand-purple/20 opacity-50" />

                  {/* Placeholder Content */}
                  <div className="relative z-10 flex flex-col items-center text-center p-12">
                     <div className="w-24 h-24 rounded-full bg-brand-blue flex items-center justify-center text-white mb-8 shadow-2xl shadow-brand-blue/40 group-hover:scale-110 transition-transform cursor-pointer">
                        <PlayCircle size={48} fill="currentColor" />
                     </div>
                     <h3 className="text-3xl font-black mb-4 text-slate-900 dark:text-white">Démo de l'IA Coach</h3>
                     <p className="text-slate-500 dark:text-slate-400 font-bold max-w-md">
                        Découvrez comment Maîtris analyse votre expression orale et écrite en quelques secondes.
                     </p>
                     <p className="mt-8 text-xs font-black uppercase tracking-[0.3em] text-brand-gold animate-pulse">
                        Vidéo en cours de production
                     </p>
                  </div>

                  {/* Animated Background shapes */}
                  <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand-gold/10 rounded-full blur-3xl" />
                  <div className="absolute -top-20 -left-20 w-64 h-64 bg-brand-purple/10 rounded-full blur-3xl" />
               </div>

               <div className="lg:col-span-2 p-10 flex flex-col justify-center">
                  <div className="space-y-8">
                     <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0">
                           <Sparkles size={24} />
                        </div>
                        <div>
                           <h4 className="font-black text-slate-900 dark:text-white mb-1">Feedback Ultra-Rapide</h4>
                           <p className="text-sm text-slate-500 leading-relaxed">Correction instantanée de vos erreurs de grammaire et de syntaxe.</p>
                        </div>
                     </div>

                     <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                           <Star size={24} />
                        </div>
                        <div>
                           <h4 className="font-black text-slate-900 dark:text-white mb-1">Score TEF Estimé</h4>
                           <p className="text-sm text-slate-500 leading-relaxed">Sachez exactement où vous vous situez par rapport aux niveaux A1-B2.</p>
                        </div>
                     </div>

                     <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                           <ShieldCheck size={24} />
                        </div>
                        <div>
                           <h4 className="font-black text-slate-900 dark:text-white mb-1">100% Conforme</h4>
                           <p className="text-sm text-slate-500 leading-relaxed">Exercices alignés sur les dernières exigences du Ministère de l'Intérieur.</p>
                        </div>
                     </div>
                  </div>

                  <div className="mt-12 pt-10 border-t border-slate-100 dark:border-white/5 text-center">
                     <button
                       onClick={onClose}
                       className="text-brand-blue dark:text-brand-gold font-black uppercase tracking-widest text-xs hover:underline"
                     >
                       Fermer la démo
                     </button>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
