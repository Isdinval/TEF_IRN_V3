"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Play, CheckCircle2, Globe, Users, Euro, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoModal } from "../VideoModal";

export function Hero() {
  const [videoOpen, setVideoOpen] = useState(false);

  const typingWords = ["votre succès", "votre avenir", "votre naturalisation", "votre résidence"];
  const [wordIndex, setWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const fullWord = typingWords[wordIndex];
      if (!isDeleting) {
        setCurrentText(fullWord.substring(0, currentText.length + 1));
        if (currentText.length === fullWord.length) {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        setCurrentText(fullWord.substring(0, currentText.length - 1));
        if (currentText.length === 0) {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % typingWords.length);
        }
      }
    }, isDeleting ? 50 : 100);
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, wordIndex]);

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden bg-white dark:bg-brand-dark">
      {/* Background Animated Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-blue/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-purple/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-8"
          >
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              <Globe size={12} className="text-brand-blue" />
              🇫🇷 VISA • NATURALISATION • RÉSIDENCE
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 dark:text-white mb-8 leading-[0.95]"
          >
            Réussissez le TEF IRN <br />
            <span className="text-brand-blue dark:text-brand-gold">avec l'IA</span> qui garantit <br />
            <span className="relative inline-block min-w-[300px]">
              {currentText}
              <span className="absolute right-[-4px] top-0 bottom-0 w-1 bg-brand-blue dark:bg-brand-gold animate-pulse" />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-3xl mb-12 leading-relaxed font-medium"
          >
            La seule plateforme qui corrige votre expression écrite et orale en temps réel.
            <span className="text-slate-900 dark:text-white font-bold"> Ne laissez plus 50% de l'examen au hasard.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-6"
          >
            <Link href="/TEF_IRN/login?mode=signup">
              <Button className="h-16 px-10 text-xl font-black bg-brand-blue hover:bg-brand-blue/90 text-white rounded-2xl shadow-2xl shadow-brand-blue/30 group">
                Commencer gratuitement
                <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <button
              onClick={() => setVideoOpen(true)}
              className="flex items-center gap-4 text-slate-900 dark:text-white font-black hover:opacity-70 transition-opacity"
            >
              <div className="w-14 h-14 rounded-full border-2 border-slate-200 dark:border-white/20 flex items-center justify-center text-brand-blue dark:text-brand-gold">
                <Play size={20} fill="currentColor" />
              </div>
              <span>Voir la démo</span>
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-slate-400"
          >
             <div className="flex items-center gap-2">
                <Users size={16} className="text-brand-blue" />
                <span>50 000+ candidats TEF IRN / an en France</span>
             </div>
             <div className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block" />
             <div className="flex items-center gap-2">
                <Euro size={16} className="text-brand-blue" />
                <span>55€/mois vs 300–800€ en formation traditionnelle</span>
             </div>
          </motion.div>
        </div>

        {/* App Preview: Coach Écrit correction example */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="relative max-w-4xl mx-auto mt-20"
        >
          <div className="relative rounded-[3rem] p-4 bg-slate-200/50 dark:bg-white/5 backdrop-blur-3xl border border-white/20 shadow-2xl overflow-hidden">
             <div className="rounded-[2.5rem] bg-white dark:bg-slate-900 overflow-hidden">
                {/* Fake browser top bar */}
                <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 dark:border-white/5">
                   <div className="w-3 h-3 rounded-full bg-red-400" />
                   <div className="w-3 h-3 rounded-full bg-amber-400" />
                   <div className="w-3 h-3 rounded-full bg-emerald-400" />
                   <span className="ml-4 text-xs font-bold text-slate-400">Coach Écrit — Expression Écrite</span>
                </div>

                <div className="p-8 md:p-10 grid md:grid-cols-3 gap-8">
                   <div className="md:col-span-2">
                      <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Votre texte</div>
                      <p className="text-lg md:text-xl leading-relaxed text-slate-700 dark:text-slate-200 font-medium">
                         Hier, je suis{" "}
                         <span className="relative">
                            <span className="line-through text-red-500">aller</span>
                            <span className="ml-2 font-black text-emerald-600">allé</span>
                         </span>{" "}
                         au marché avec mes enfants pour acheter des légumes frais.
                      </p>
                      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black">
                         <CheckCircle2 size={14} />
                         Accord du participe passé corrigé
                      </div>
                   </div>

                   <div className="md:col-span-1 flex flex-col gap-3">
                      <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Analyse IA</div>
                      <div className="p-4 rounded-2xl bg-brand-blue text-white">
                         <div className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Score estimé</div>
                         <div className="font-black text-3xl flex items-center gap-1">B2 <Star size={18} className="text-brand-gold" /></div>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 text-sm font-bold text-slate-600 dark:text-slate-300">
                         <span>Grammaire</span><span className="text-emerald-600">9/10</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 text-sm font-bold text-slate-600 dark:text-slate-300">
                         <span>Vocabulaire</span><span className="text-emerald-600">8/10</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </motion.div>
      </div>

      <VideoModal isOpen={videoOpen} onClose={() => setVideoOpen(false)} />
    </section>
  );
}
