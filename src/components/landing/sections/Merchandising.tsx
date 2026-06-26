"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Heart, Star, Sparkles, ShoppingBag } from "lucide-react";
import Image from "next/image";

export function Merchandising() {
  const items = [
    {
      title: "La Peluche LlamaKuzy",
      desc: "Votre compagnon de révision ultra-doux pour rester motivé chaque jour.",
      image: "/images/merch/peluche-llamakuzy.png",
      badge: "Indispensable"
    },
    {
      title: "T-shirt 'I passed TEF'",
      desc: "Le t-shirt officiel à porter fièrement le jour de votre naturalisation.",
      image: "/images/merch/tshirt-passed.png",
      badge: "Collector"
    },
    {
      title: "Le Pack Success",
      desc: "L'univers complet LlamaKuzy pour transformer votre stress en succès.",
      image: "/images/merch/lifestyle-merch.png",
      badge: "Best Seller"
    }
  ];

  return (
    <section id="merch" className="py-32 px-6 bg-white dark:bg-brand-dark relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col items-center text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="w-16 h-16 bg-brand-gold/10 rounded-2xl flex items-center justify-center text-brand-gold mb-6"
          >
            <Heart size={32} fill="currentColor" />
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight text-slate-900 dark:text-white">
            Rejoignez l'univers <br />
            <span className="text-brand-gold uppercase italic">LlamaKuzy.</span>
          </h2>

          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mb-12 leading-relaxed font-medium">
            Parce que réussir son intégration est une aventure humaine, nous avons créé des objets qui vous rappellent votre objectif et célèbrent vos victoires.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group"
            >
              <div className="relative aspect-square rounded-[3rem] overflow-hidden mb-8 shadow-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-6 left-6 px-4 py-1.5 bg-white/90 dark:bg-brand-dark/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-brand-gold shadow-lg">
                  {item.badge}
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                {item.title}
                <Sparkles size={18} className="text-brand-gold opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 p-12 rounded-[4rem] bg-gradient-to-br from-brand-gold/10 to-amber-500/10 border border-brand-gold/20 flex flex-col md:flex-row items-center justify-between gap-10 text-center md:text-left"
        >
          <div>
            <div className="flex items-center gap-2 text-brand-gold font-black uppercase tracking-[0.2em] text-xs mb-4">
               <ShoppingBag size={16} /> Bientôt disponible
            </div>
            <h4 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Envie de votre LlamaKuzy ?</h4>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Inscrivez-vous pour être informé du lancement de la boutique officielle.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
             <input
               type="email"
               placeholder="votre@email.com"
               className="h-14 px-8 rounded-2xl bg-white dark:bg-slate-900 border border-brand-gold/30 focus:outline-none focus:ring-2 focus:ring-brand-gold font-bold w-full sm:w-64"
             />
             <Button className="h-14 px-10 bg-brand-gold hover:bg-brand-gold/90 text-brand-dark font-black rounded-2xl shadow-xl shadow-brand-gold/20 shrink-0">
               Me prévenir
             </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
