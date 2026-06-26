"use client";

import React from "react";
import { motion } from "framer-motion";
import { Linkedin, Mail, Twitter, Quote } from "lucide-react";
import Image from "next/image";

export function Team() {
  const members = [
    {
      name: "Olivier",
      role: "Fondateur & AI Engineer",
      bio: "Expert en Intelligence Artificielle, Olivier a conçu le moteur de correction Realtime de LlamaKusi. Passionné par l'éducation, il met la tech au service de l'intégration.",
      image: "/images/logo/logo.png", // Placeholder for actual photo
      color: "brand-blue"
    },
    {
      name: "Grecia",
      role: "Co-Fondatrice & User Expert",
      bio: "En plein parcours de naturalisation, Grecia apporte l'œil critique de l'utilisateur. Elle veille à ce que LlamaKusi réponde aux vraies angoisses des candidats.",
      image: "/images/logo/logo.png", // Placeholder for actual photo
      color: "brand-purple"
    }
  ];

  return (
    <section id="team" className="py-32 px-6 bg-slate-50 dark:bg-white/[0.02] relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight text-slate-900 dark:text-white">
                L'humain derrière <br />
                <span className="text-brand-blue">l'intelligence.</span>
              </h2>
              <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 leading-relaxed font-medium">
                LlamaKusi n'est pas qu'un algorithme. C'est l'alliance entre une ingénierie de pointe et une expérience vécue sur le terrain.
              </p>

              <div className="p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-xl relative">
                <Quote className="absolute -top-4 -left-4 text-brand-gold w-12 h-12 opacity-20" />
                <p className="text-lg italic font-medium text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  "Nous avons créé l'outil que nous aurions voulu avoir : un coach bienveillant, disponible 24h/24, qui ne juge jamais et qui garantit vraiment le succès."
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand-gold/20 flex items-center justify-center font-black text-brand-gold">
                    G&O
                  </div>
                  <div>
                    <div className="font-black text-slate-900 dark:text-white">Grecia & Olivier</div>
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
                className="group relative p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${member.color}/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700`} />

                <div className="relative mb-8">
                   <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-xl border-4 border-white dark:border-slate-800 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                     <Image
                       src={member.image}
                       alt={member.name}
                       width={96}
                       height={96}
                       className="object-cover"
                     />
                   </div>
                </div>

                <div className="relative">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{member.name}</h3>
                  <div className="text-sm font-bold text-brand-blue uppercase tracking-widest mb-6">{member.role}</div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                    {member.bio}
                  </p>

                  <div className="flex items-center gap-4">
                    <button className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-brand-blue transition-colors">
                      <Linkedin size={18} />
                    </button>
                    <button className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-brand-blue transition-colors">
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
