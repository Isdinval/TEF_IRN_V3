"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Play, Star, CheckCircle2, Globe, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoModal } from "../VideoModal";

export function Hero() {
  const [videoOpen, setVideoOpen] = useState(false);
  const [studentCount, setStudentCount] = useState(15420);
  const [activeUsers, setActiveUsers] = useState(124);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        const newValue = prev + change;
        return newValue < 80 ? 80 : newValue > 250 ? 250 : newValue;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
            <Link href="/login?mode=signup">
              <Button className="h-16 px-10 text-xl font-black bg-brand-blue hover:bg-brand-blue/90 text-white rounded-2xl shadow-2xl shadow-indigo-100/50 shadow-brand-blue/30 group">
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
            className="mt-16 flex flex-col items-center gap-4"
          >
             <div className="flex items-center gap-1 text-brand-gold">
                {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="currentColor" />)}
                <span className="ml-2 text-slate-900 dark:text-white font-black">4,8/5</span>
             </div>
             <div className="flex items-center gap-6 text-sm font-bold text-slate-400">
                <div className="flex items-center gap-2">
                   <Users size={16} className="text-brand-blue" />
                   <span>+{studentCount.toLocaleString()} apprenants</span>
                </div>
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                   <span>{activeUsers} s'entraînent en ce moment</span>
                </div>
             </div>
          </motion.div>
        </div>

        {/* Abstract App Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="relative max-w-6xl mx-auto mt-20"
        >
          <div className="relative rounded-[4rem] p-4 bg-slate-200/50 dark:bg-white/5 backdrop-blur-3xl border border-white/20 shadow-2xl shadow-indigo-100/50 overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/20 to-brand-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
             <div className="rounded-[3.5rem] bg-white dark:bg-slate-900 aspect-[21/9] flex items-center justify-center overflow-hidden relative">
                <div className="grid grid-cols-12 gap-8 w-full h-full p-12 opacity-40">
                   <div className="col-span-3 space-y-4">
                      <div className="h-8 w-full bg-slate-100 dark:bg-white/5 rounded-lg" />
                      <div className="h-4 w-2/3 bg-slate-100 dark:bg-white/5 rounded-lg" />
                      <div className="space-y-2 pt-8">
                         {[1,2,3,4,5].map(i => <div key={i} className="h-10 w-full bg-slate-50 dark:bg-white/5 rounded-xl" />)}
                      </div>
                   </div>
                   <div className="col-span-9 space-y-8">
                      <div className="flex justify-between items-center">
                         <div className="h-10 w-48 bg-slate-100 dark:bg-white/5 rounded-xl" />
                         <div className="flex gap-4">
                            <div className="h-10 w-10 bg-slate-100 dark:bg-white/5 rounded-full" />
                            <div className="h-10 w-32 bg-brand-blue/20 rounded-full" />
                         </div>
                      </div>
                      <div className="h-64 w-full bg-slate-50 dark:bg-white/5 rounded-[2rem] p-8">
                         <div className="space-y-4">
                            <div className="h-4 w-full bg-slate-200/50 dark:bg-white/10 rounded-full" />
                            <div className="h-4 w-full bg-slate-200/50 dark:bg-white/10 rounded-full" />
                            <div className="h-4 w-3/4 bg-slate-200/50 dark:bg-white/10 rounded-full" />
                         </div>
                      </div>
                   </div>
                </div>

                {/* Floating elements to show IA power */}
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/4 left-1/3 p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl shadow-indigo-100/50 border border-slate-100 dark:border-white/5 z-20 flex items-center gap-4"
                >
                   <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white">
                      <CheckCircle2 size={24} />
                   </div>
                   <div>
                      <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Analyse IA</div>
                      <div className="font-bold text-slate-900 dark:text-white">Accord sujet-verbe corrigé</div>
                   </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 20, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-1/4 right-1/4 p-6 bg-brand-blue text-white rounded-3xl shadow-2xl shadow-indigo-100/50 shadow-brand-blue/40 z-20 flex items-center gap-4"
                >
                   <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <Star size={24} className="text-brand-gold" />
                   </div>
                   <div>
                      <div className="text-xs font-black text-blue-200 uppercase tracking-widest mb-1">Score Estimé</div>
                      <div className="font-black text-2xl">B2+</div>
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
