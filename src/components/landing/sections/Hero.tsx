"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Play, CheckCircle2, Globe, Users, Euro, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoModal } from "../VideoModal";
import Image from "next/image";

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
          </motion.div>
        </div>

        {/* === HERO IMAGE === */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative w-full aspect-[16/6.5] max-h-[560px] overflow-hidden rounded-3xl shadow-2xl"
        >
          <Image
            src="https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/landing_page/IMAGE1.webp" 
            alt="Olivier et Grecia, fondateurs de LlamaKusi, marchant sur les quais de Seine à Paris avec la Tour Eiffel"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 1200px"
          />
        </motion.div>

        {/* Légende explicative */}
        <p className="mt-6 text-center text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-3xl mx-auto">
          Olivier et Grecia, fondateurs de LlamaKusi. Ils ont créé cette plateforme après avoir vécu eux-mêmes les difficultés du parcours de naturalisation. Leur histoire est au cœur de notre mission.
        </p>
      </div>

      <VideoModal isOpen={videoOpen} onClose={() => setVideoOpen(false)} />
    </section>
  );
}
