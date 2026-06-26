"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Play, Star, Users, Globe, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { VideoModal } from "../VideoModal";

export function Hero() {
  const [videoOpen, setVideoOpen] = useState(false);
  const [studentCount, setStudentCount] = useState(12450);
  const [activeUsers, setActiveUsers] = useState(42);

  // Stats simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setStudentCount(prev => prev + Math.floor(Math.random() * 2));
      setActiveUsers(Math.floor(Math.random() * (60 - 30 + 1)) + 30);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const fullPhrase = "qui garantit votre succès";
  const [phase, setPhase] = useState("fade-in"); // fade-in, typing

  useEffect(() => {
    if (phase === "typing") {
      const timer = setTimeout(() => {
        if (!isDeleting) {
          setCurrentText(fullPhrase.substring(0, currentText.length + 1));
          if (currentText.length === fullPhrase.length) {
            setTimeout(() => setIsDeleting(true), 3000);
          }
        } else {
          setCurrentText(fullPhrase.substring(0, currentText.length - 1));
          if (currentText.length === 0) {
            setIsDeleting(false);
          }
        }
      }, isDeleting ? 40 : 80);
      return () => clearTimeout(timer);
    }
  }, [currentText, isDeleting, phase]);

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

          <div className="relative">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              onAnimationComplete={() => setPhase("typing")}
              className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 dark:text-white mb-8 leading-[0.95]"
            >
              Réussissez le TEF IRN <br />
              <span className="text-brand-blue dark:text-brand-gold">avec l'IA</span> <br className="md:hidden" />
              <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-purple dark:from-brand-gold dark:to-amber-500">
                {currentText || "\u00A0"}
                <span className="absolute right-[-4px] top-0 bottom-0 w-1 bg-brand-blue dark:bg-brand-gold animate-pulse" />
              </span>
            </motion.h1>

            {/* LlamaKuzy Peek */}
            <motion.div
              initial={{ rotate: -20, x: -50, opacity: 0 }}
              animate={{ rotate: -10, x: 0, opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              className="absolute -top-12 -left-12 md:-left-24 w-24 h-24 md:w-32 md:h-32 hidden sm:block"
            >
              <Image
                src="/images/logo/logo.png"
                alt="LlamaKuzy"
                width={128}
                height={128}
                className="drop-shadow-2xl"
              />
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-3xl mb-12 leading-relaxed font-medium"
          >
            L'IA qui corrige votre expression écrite et orale en temps réel.
            <span className="text-slate-900 dark:text-white font-bold block mt-2"> Rejoignez 50 000+ candidats qui ne laissent plus leur succès au hasard.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-6"
          >
            <Link href="/TEF_IRN/login?mode=signup">
              <Button className="h-16 px-10 text-xl font-black bg-brand-blue hover:bg-brand-blue/90 text-white rounded-2xl shadow-2xl shadow-brand-blue/30 group">
                Essai Gratuit 7 Jours
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
            className="mt-16 flex flex-col items-center gap-4"
          >
             <div className="flex items-center gap-1 text-brand-gold">
                {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}
                <span className="ml-2 text-slate-900 dark:text-white font-black">4,9/5 sur Trustpilot</span>
             </div>
             <div className="flex items-center gap-6 text-sm font-bold text-slate-400">
                <div className="flex items-center gap-2">
                   <Users size={16} className="text-brand-blue" />
                   <span>+{studentCount.toLocaleString()} naturalisés</span>
                </div>
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                   <span>{activeUsers} s'entraînent avec LlamaKuzy</span>
                </div>
             </div>
          </motion.div>
        </div>

        {/* App Mockup with Mascot interaction */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="relative max-w-6xl mx-auto mt-20"
        >
          <div className="relative rounded-[3rem] p-4 bg-slate-200/50 dark:bg-white/5 backdrop-blur-3xl border border-white/20 shadow-2xl overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/20 to-brand-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
             <div className="rounded-[2.5rem] bg-white dark:bg-slate-900 aspect-[16/9] md:aspect-[21/9] flex items-center justify-center overflow-hidden relative">

                {/* Simulation logic - simple visualization */}
                <div className="grid grid-cols-12 gap-8 w-full h-full p-12 opacity-40">
                   <div className="col-span-3 space-y-4">
                      <div className="h-8 w-full bg-slate-100 dark:bg-white/5 rounded-lg" />
                      <div className="h-4 w-2/3 bg-slate-100 dark:bg-white/5 rounded-lg" />
                      <div className="space-y-2 pt-8">
                         {[1,2,3,4].map(i => <div key={i} className="h-10 w-full bg-slate-50 dark:bg-white/5 rounded-xl" />)}
                      </div>
                   </div>
                   <div className="col-span-9 space-y-8">
                      <div className="flex justify-between items-center">
                         <div className="h-10 w-48 bg-slate-100 dark:bg-white/5 rounded-xl" />
                         <div className="h-10 w-32 bg-brand-blue/20 rounded-full" />
                      </div>
                      <div className="h-64 w-full bg-slate-50 dark:bg-white/5 rounded-[2rem] p-8">
                         <div className="space-y-4">
                            <div className="h-4 w-full bg-slate-200/50 dark:bg-white/10 rounded-full" />
                            <div className="h-4 w-full bg-slate-200/50 dark:bg-white/10 rounded-full" />
                         </div>
                      </div>
                   </div>
                </div>

                {/* Floating elements to show IA power */}
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/4 left-[10%] md:left-1/3 p-4 md:p-6 bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl shadow-2xl border border-slate-100 dark:border-white/5 z-20 flex items-center gap-4"
                >
                   <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-500 flex items-center justify-center text-white">
                      <CheckCircle2 size={24} />
                   </div>
                   <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Analyse IA</div>
                      <div className="font-bold text-sm md:text-base text-slate-900 dark:text-white">Correction syntaxique <Sparkles className="inline ml-1 text-brand-gold" size={14} /></div>
                   </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 15, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-1/4 right-[10%] md:right-1/4 p-4 md:p-6 bg-brand-blue text-white rounded-2xl md:rounded-3xl shadow-2xl shadow-brand-blue/40 z-20 flex items-center gap-4"
                >
                   <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <Star size={24} className="text-brand-gold" />
                   </div>
                   <div>
                      <div className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Score Prédit</div>
                      <div className="font-black text-xl md:text-2xl">Niveau B2+</div>
                   </div>
                </motion.div>

                {/* Mascot celebrating */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 2, type: "spring" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-brand-gold/20 rounded-full blur-3xl animate-pulse" />
                    <Image
                      src="/images/merch/peluche-llamakuzy.png"
                      alt="LlamaKuzy Success"
                      width={200}
                      height={200}
                      className="relative z-10 drop-shadow-2xl"
                    />
                  </div>
                </motion.div>
             </div>
          </div>
        </motion.div>
      </div>

      <VideoModal isOpen={videoOpen} onClose={() => setVideoOpen(false)} />
    </section>
  );
}
