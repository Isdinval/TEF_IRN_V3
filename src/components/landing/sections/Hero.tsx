"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Play, CheckCircle2, Globe, Users, Euro, Sparkles, PenTool, Mic2, BookOpen, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoModal } from "../VideoModal";

export function Hero() {
  const [videoOpen, setVideoOpen] = useState(false);

  const typingWords = ["votre naturalisation", "votre carte de résident", "l'Examen Civique", "le TEF IRN"];
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
              🇫🇷 EXAMEN CIVIQUE • TEF IRN • NATURALISATION
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 dark:text-white mb-8 leading-[0.95]"
          >
            Un coach IA pour réussir <br />
            <span className="text-brand-blue dark:text-brand-gold">
              <span className="relative inline-block min-w-[280px]">
                {currentText}
                <span className="absolute right-[-4px] top-0 bottom-0 w-1 bg-brand-blue dark:bg-brand-gold animate-pulse" />
              </span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-3xl mb-12 leading-relaxed font-medium"
          >
            Le parcours de naturalisation a deux étapes : l'Examen Civique et le TEF IRN.
            <span className="text-slate-900 dark:text-white font-bold"> LlamaKusi vous accompagne sur les deux, avec un coach IA qui corrige votre écrit et votre oral en temps réel.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-6"
          >
            <Link href="/tef-irn/login?mode=signup">
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
            <div className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block" />
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-brand-blue" />
              <span>Le seul coach IA sur les 4 épreuves + l'Examen Civique</span>
            </div>
          </motion.div>
        </div>

        {/* === MOCKUP PRODUIT (fidèle à /tef-irn/writing — panneau Feedback IA) === */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative w-full max-w-5xl mx-auto rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-[#111827]"
        >
          <div className="flex items-center justify-between px-8 py-5 bg-zinc-900/60 border-b border-white/5">
            <div className="flex items-center gap-2 text-white font-black uppercase tracking-tighter text-sm">
              <Sparkles size={18} className="text-indigo-400" /> Feedback IA — Expression Écrite
            </div>
            <div className="hidden sm:flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/40">
              <span className="flex items-center gap-1"><PenTool size={12} /> Écrit</span>
              <span className="flex items-center gap-1"><Mic2 size={12} /> Oral</span>
              <span className="flex items-center gap-1"><Headphones size={12} /> Compréhension</span>
              <span className="flex items-center gap-1"><BookOpen size={12} /> Civique</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
            <div className="md:col-span-3 p-8 text-white/70 text-sm leading-relaxed border-b md:border-b-0 md:border-r border-white/5">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-4">Votre texte</p>
              <p>
                Je pense que le président de la République <span className="underline decoration-red-400 decoration-2 underline-offset-4">a prit</span> une bonne décision. Cette réforme <span className="underline decoration-red-400 decoration-2 underline-offset-4">vont</span> beaucoup aider les citoyens dans leur vie quotidienne.
              </p>
            </div>
            <div className="md:col-span-2 p-8 space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Score Global</p>
                <p className="text-4xl font-black text-white">86<span className="text-lg opacity-40">/100</span></p>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2 text-white/70">
                  <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>« a prit » → <span className="text-emerald-400 font-bold">« a pris »</span> (participe passé)</span>
                </div>
                <div className="flex items-start gap-2 text-white/70">
                  <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>« vont » → <span className="text-emerald-400 font-bold">« va »</span> (accord sujet singulier)</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <p className="mt-6 text-center text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-3xl mx-auto">
          Aperçu du coach d'Expression Écrite. Le même principe de correction guidée s'applique à l'oral, à la compréhension et aux fiches de l'Examen Civique.
        </p>
      </div>

      <VideoModal isOpen={videoOpen} onClose={() => setVideoOpen(false)} />
    </section>
  );
}
