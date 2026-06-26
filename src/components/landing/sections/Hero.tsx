"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Star, Users, CheckCircle2, Sparkles, Globe, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { VideoModal } from "../VideoModal";

export function Hero() {
  const [videoOpen, setVideoOpen] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [phase, setPhase] = useState<"fade" | "typing">("fade");

  const fullText = "qui garantit votre succès";
  const [studentCount, setStudentCount] = useState(48230);
  const [activeUsers, setActiveUsers] = useState(124);

  useEffect(() => {
    if (phase === "typing") {
      let index = 0;
      const interval = setInterval(() => {
        setCurrentText(fullText.slice(0, index));
        index++;
        if (index > fullText.length) {
          clearInterval(interval);
        }
      }, 60);
      return () => clearInterval(interval);
    }
  }, [phase]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(prev => prev + (Math.random() > 0.5 ? 1 : -1));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-white dark:bg-brand-dark">
      {/* Background blobs for premium feel */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-[140px] -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-brand-purple/5 rounded-full blur-[140px] translate-y-1/2" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              <Globe size={12} className="text-brand-blue" />
              🇫🇷 VISA • NATURALISATION • RÉSIDENCE
            </span>
          </motion.div>

          <div className="relative">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              onAnimationComplete={() => setPhase("typing")}
              className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 dark:text-white mb-8 leading-[0.95]"
            >
              Réussissez le TEF IRN <br />
              <span className="text-brand-blue dark:text-brand-gold">avec l'IA </span>
              <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-purple dark:from-brand-gold dark:to-amber-500">
                {currentText || "\u00A0"}
                <span className="absolute right-[-4px] top-0 bottom-0 w-1 bg-brand-blue dark:bg-brand-gold animate-pulse" />
              </span>
            </motion.h1>

            {/* LlamaKuzy Peek - More prominent and friendly */}
            <motion.div
              initial={{ rotate: -20, x: -50, opacity: 0 }}
              animate={{ rotate: -10, x: 0, opacity: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
              className="absolute -top-16 -left-12 md:-left-24 w-28 h-28 md:w-40 md:h-40 hidden sm:block"
            >
              <Image
                src="/images/logo/logo.png"
                alt="LlamaKuzy"
                width={160}
                height={160}
                className="drop-shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
              />
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-3xl mb-12 leading-relaxed font-medium"
          >
            Le premier coach immersif qui corrige votre expression écrite et orale en temps réel.
            <span className="text-slate-900 dark:text-white font-bold block mt-2"> Rejoignez 50 000+ candidats qui ne laissent plus leur succès au hasard.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
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
            transition={{ delay: 0.8 }}
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

        {/* Mockup with dynamic indicators */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="relative max-w-6xl mx-auto mt-20"
        >
          <div className="relative rounded-[3rem] p-4 bg-slate-200/50 dark:bg-white/5 backdrop-blur-3xl border border-white/20 shadow-2xl overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/10 to-brand-purple/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

             {/* Realistic App UI Mockup Placeholder */}
             <div className="rounded-[2.5rem] bg-white dark:bg-slate-900 aspect-[16/9] md:aspect-[21/9] flex items-center justify-center overflow-hidden relative border border-slate-200 dark:border-white/5">

                {/* Simulated Dashboard/Correction View */}
                <div className="w-full h-full p-8 md:p-12 opacity-60 flex flex-col gap-6">
                   <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-6">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/10" />
                         <div className="space-y-2">
                            <div className="h-4 w-32 bg-slate-100 dark:bg-white/10 rounded-full" />
                            <div className="h-3 w-20 bg-slate-50 dark:bg-white/5 rounded-full" />
                         </div>
                      </div>
                      <div className="flex gap-2">
                         <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-white/5" />
                         <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-white/5" />
                      </div>
                   </div>

                   <div className="grid grid-cols-12 gap-8 flex-1">
                      <div className="col-span-8 space-y-4">
                         <div className="h-6 w-1/3 bg-slate-100 dark:bg-white/10 rounded-full" />
                         <div className="h-40 w-full bg-slate-50 dark:bg-brand-blue/5 rounded-[2rem] border border-brand-blue/10 p-6">
                            <div className="space-y-3">
                               <div className="h-3 w-full bg-slate-200/50 dark:bg-white/10 rounded-full" />
                               <div className="h-3 w-[90%] bg-slate-200/50 dark:bg-white/10 rounded-full" />
                               <div className="h-3 w-2/3 bg-brand-blue/20 rounded-full border border-brand-blue/30" />
                            </div>
                         </div>
                         <div className="flex gap-4">
                            <div className="h-12 w-40 bg-brand-blue rounded-xl" />
                            <div className="h-12 w-12 bg-slate-100 dark:bg-white/10 rounded-xl" />
                         </div>
                      </div>
                      <div className="col-span-4 space-y-6">
                         <div className="h-32 w-full bg-slate-50 dark:bg-brand-purple/5 rounded-[2rem] border border-brand-purple/10" />
                         <div className="h-48 w-full bg-slate-50 dark:bg-brand-gold/5 rounded-[2rem] border border-brand-gold/10" />
                      </div>
                   </div>
                </div>

                {/* High-Impact Floating Elements */}
                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/4 left-1/4 p-4 md:p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-white/5 z-20 flex items-center gap-4"
                >
                   <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white">
                      <CheckCircle2 size={24} />
                   </div>
                   <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Analyse Syntaxique</div>
                      <div className="font-bold text-slate-900 dark:text-white">Correction B2 validée <Sparkles className="inline ml-1 text-brand-gold" size={14} /></div>
                   </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-1/4 right-[15%] p-4 md:p-6 bg-brand-blue text-white rounded-3xl shadow-[0_20px_50px_rgba(59,130,246,0.3)] z-20 flex items-center gap-4"
                >
                   <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <Star size={24} className="text-brand-gold" />
                   </div>
                   <div>
                      <div className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Projection TEF</div>
                      <div className="font-black text-2xl">Score 580+ (C1)</div>
                   </div>
                </motion.div>

                {/* Mascot Interaction */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 2, type: "spring" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
                >
                  <div className="relative group/mascot">
                    <div className="absolute inset-0 bg-brand-gold/20 rounded-full blur-3xl animate-pulse" />
                    <Image
                      src="/images/merch/peluche-llamakuzy.png"
                      alt="LlamaKuzy Motivation"
                      width={220}
                      height={220}
                      className="relative z-10 drop-shadow-2xl group-hover/mascot:scale-110 transition-transform duration-500"
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
