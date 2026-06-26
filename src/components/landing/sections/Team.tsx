"use client";

import React from "react";
import { motion } from "framer-motion";
import { Linkedin, Mail, Quote } from "lucide-react";
import Image from "next/image";

export function Team() {
  const members = [
    {
      name: "Olivier",
      role: "Fondateur & AI Engineer",
      bio: "Ancien ingénieur dans la Silicon Valley, Olivier a conçu le moteur Realtime de LlamaKusi. Sa mission : démocratiser l'accès aux meilleures technologies d'IA pour l'éducation.",
      image: "/images/logo/logo.png",
      color: "brand-blue"
    },
    {
      name: "Grecia",
      role: "Co-fondatrice & User Expert",
      bio: "Ayant elle-même traversé le parcours du combattant de la naturalisation en tant que salariée, Grecia veille à ce que l'outil reste humain, empathique et centré sur vos besoins réels.",
      image: "/images/logo/logo.png",
      color: "brand-purple"
    }
  ];

  return (
    <section id="team" className="py-32 px-6 bg-slate-50 dark:bg-white/[0.02] relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-brand-purple/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue/10 border border-brand-blue/20 mb-8">
                <span className="w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-blue">L'équipe LlamaKusi</span>
              </div>

              <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight text-slate-900 dark:text-white">
                L'humain derrière <br />
                <span className="text-brand-blue">l'intelligence.</span>
              </h2>
              <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 leading-relaxed font-medium">
                LlamaKusi n'est pas qu'un algorithme froid. C'est l'alliance entre une ingénierie de pointe et une expérience vécue. Nous comprenons vos doutes parce que nous les avons partagés.
              </p>

              <div className="p-10 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-2xl relative group">
                <Quote className="absolute -top-4 -left-4 text-brand-gold w-16 h-16 opacity-10 group-hover:opacity-20 transition-opacity" />
                <p className="text-xl italic font-medium text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
                  "Nous avons créé l'outil que Grecia aurait voulu avoir quand elle révisait son TEF après ses journées de travail : un coach bienveillant, disponible 24h/24, qui ne juge jamais."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand-gold/10 flex items-center justify-center font-black text-brand-gold rotate-3 group-hover:rotate-0 transition-transform">
                    G&O
                  </div>
                  <div>
                    <div className="font-black text-slate-900 dark:text-white text-lg">Grecia & Olivier</div>
                    <div className="text-sm font-bold text-slate-400">Fondateurs de LlamaKusi</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {members.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative p-10 bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-xl hover:shadow-3xl transition-all duration-500 overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${member.color}/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700`} />

                <div className="relative mb-8">
                   <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-white dark:border-slate-800 rotate-3 group-hover:rotate-0 transition-transform duration-500 bg-slate-50 flex items-center justify-center">
                     <Image
                       src={member.image}
                       alt={member.name}
                       width={80}
                       height={80}
                       className="opacity-20 grayscale group-hover:opacity-40 group-hover:grayscale-0 transition-all duration-500"
                     />
                   </div>
                </div>

                <div className="relative">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{member.name}</h3>
                  <div className={`text-[10px] font-black text-${member.name === 'Olivier' ? 'brand-blue' : 'brand-purple'} uppercase tracking-[0.2em] mb-6`}>{member.role}</div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                    {member.bio}
                  </p>

                  <div className="flex items-center gap-3">
                    <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 transition-all border border-transparent hover:border-brand-blue/20">
                      <Linkedin size={18} />
                    </button>
                    <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 transition-all border border-transparent hover:border-brand-blue/20">
                      <Mail size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
