"use client";

import React from "react";
import { motion } from "framer-motion";
import { Trophy, Zap, Shield, Star, ShoppingBag, CheckCircle2 } from "lucide-react";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";

const gameFeatures = [
  { icon: <Trophy size={32} />, title: "Ligues Hebdo", color: "text-amber-500", bg: "bg-amber-500/10" },
  { icon: <Zap size={32} />, title: "Séries & XP", color: "text-orange-500", bg: "bg-orange-500/10" },
  { icon: <Shield size={32} />, title: "Succès & Badges", color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { icon: <Star size={32} />, title: "Classement", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { icon: <ShoppingBag size={32} />, title: "Shop Récompenses", color: "text-rose-500", bg: "bg-rose-500/10" },
];

export function Gamification() {
  return (
    <section className="py-32 px-6 bg-white dark:bg-brand-dark overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-24">
           <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight text-slate-900 dark:text-white">
             Progressez en vous <br />
             <span className="text-brand-purple">amusant (vraiment).</span>
           </h2>
           <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl font-medium leading-relaxed">
             Nous avons intégré les meilleurs leviers de motivation pour que votre préparation devienne un plaisir quotidien.
           </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-20">
           {gameFeatures.map((item, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, scale: 0.9 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ delay: i * 0.1 }}
               className="flex flex-col items-center p-8 rounded-[3.5rem] bg-slate-50 dark:bg-white/5 group hover:bg-white dark:hover:bg-white/10 hover:shadow-2xl transition-all duration-500 cursor-default"
             >
                <div className={`w-20 h-20 rounded-3xl ${item.bg} ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                   {item.icon}
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white text-center">{item.title}</h3>
             </motion.div>
           ))}
        </div>

        <div className="max-w-4xl mx-auto bg-slate-900 rounded-[4rem] p-8 md:p-16 relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 p-32 bg-brand-purple/20 blur-[120px] rounded-full" />

           <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div className="space-y-8 text-white">
                 <div className="space-y-4">
                    <div className="flex justify-between font-black text-sm uppercase tracking-widest">
                       <span>Progression Quotidienne</span>
                       <span className="text-brand-purple">80%</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                       <Progress value={80} className="w-full">
                          <ProgressTrack className="h-4 bg-white/10 rounded-full">
                             <ProgressIndicator className="bg-brand-purple h-full rounded-full" />
                          </ProgressTrack>
                       </Progress>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex justify-between font-black text-sm uppercase tracking-widest">
                       <span>Maîtrise Vocabulaire</span>
                       <span className="text-brand-gold">450 / 1500 mots</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                       <Progress value={30} className="w-full">
                          <ProgressTrack className="h-4 bg-white/10 rounded-full">
                             <ProgressIndicator className="bg-brand-gold h-full rounded-full" />
                          </ProgressTrack>
                       </Progress>
                    </div>
                 </div>

                 <div className="flex items-center gap-6 pt-4">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-2">Série Actuelle</span>
                       <div className="flex items-center gap-2">
                          <Zap size={24} className="text-orange-500 fill-orange-500" />
                          <span className="text-3xl font-black text-white tracking-tighter">12 JOURS</span>
                       </div>
                    </div>
                    <div className="w-px h-12 bg-white/10" />
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-2">Points XP</span>
                       <div className="flex items-center gap-2">
                          <Star size={24} className="text-brand-gold fill-brand-gold" />
                          <span className="text-3xl font-black text-white tracking-tighter">14,250</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col gap-4">
                 {[
                   { title: "Ligue Diamant", desc: "Top 3 cette semaine", active: true },
                   { title: "Polyglotte", desc: "100 mots maîtrisés", active: true },
                   { title: "Maître de l'Oral", desc: "1h de pratique IA", active: false }
                 ].map((badge, i) => (
                   <motion.div
                     key={i}
                     initial={{ x: 50, opacity: 0 }}
                     whileInView={{ x: 0, opacity: 1 }}
                     transition={{ delay: 0.5 + (i * 0.1) }}
                     className={`p-6 rounded-2xl flex items-center gap-4 border ${badge.active ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 opacity-50'}`}
                   >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${badge.active ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/10 text-white'}`}>
                         <CheckCircle2 size={20} />
                      </div>
                      <div>
                         <div className="font-black text-white">{badge.title}</div>
                         <div className="text-xs text-white/60 font-medium">{badge.desc}</div>
                      </div>
                   </motion.div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </section>
  );
}
