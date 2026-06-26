"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Heart, Star, Sparkles, ShoppingBag, ArrowRight } from "lucide-react";
import Image from "next/image";

export function Merchandising() {
  const items = [
    {
      title: "La Peluche LlamaKuzy",
      desc: "Plus qu'un doudou, c'est votre garde du corps contre le stress. Elle vous rappelle chaque jour que vous allez réussir.",
      image: "/images/merch/peluche-llamakuzy.png",
      badge: "Indispensable"
    },
    {
      title: "T-shirt 'I passed TEF'",
      desc: "La tenue officielle de votre nouvelle vie. À porter avec fierté après avoir reçu votre attestation B2.",
      image: "/images/merch/tshirt-passed.png",
      badge: "Collector"
    },
    {
      title: "Le Pack Success",
      desc: "L'univers complet pour transformer votre chambre en centre d'entraînement intensif et bienveillant.",
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
            className="w-20 h-20 bg-brand-gold/10 rounded-[2rem] flex items-center justify-center text-brand-gold mb-8"
          >
            <Heart size={40} fill="currentColor" />
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight text-slate-900 dark:text-white">
            Portez vos victoires <br />
            avec <span className="text-brand-gold uppercase italic">LlamaKuzy.</span>
          </h2>

          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mb-12 leading-relaxed font-medium">
            Le TEF n'est pas qu'un examen, c'est une étape de vie. Nos objets célèbrent votre courage et votre détermination à réussir en France.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group"
            >
              <div className="relative aspect-[4/5] rounded-[3.5rem] overflow-hidden mb-8 shadow-2xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-8 left-8 px-5 py-2 bg-white/90 dark:bg-brand-dark/90 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest text-brand-gold shadow-lg">
                  {item.badge}
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                {item.title}
                <Sparkles size={18} className="text-brand-gold opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Wishlist / Waitlist Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative p-12 rounded-[4rem] bg-gradient-to-br from-brand-gold to-amber-500 shadow-2xl shadow-brand-gold/20 overflow-hidden"
        >
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
             <div className="max-w-xl text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest mb-6">
                   <ShoppingBag size={14} /> Boutique bientôt disponible
                </div>
                <h3 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
                  Rejoignez la wishlist et <br />
                  obtenez -20% au lancement.
                </h3>
                <p className="text-amber-50 font-medium text-lg opacity-90">
                  Accès prioritaire aux stocks limités et cadeaux exclusifs pour les 500 premiers inscrits.
                </p>
             </div>

             <div className="w-full lg:w-[400px] bg-white/10 backdrop-blur-xl p-8 rounded-[3rem] border border-white/20">
                <form className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-xs font-black text-white uppercase tracking-widest ml-4">Email</label>
                      <input
                        type="email"
                        placeholder="votre@email.com"
                        className="w-full h-14 px-8 rounded-2xl bg-white focus:outline-none focus:ring-4 focus:ring-white/20 font-bold text-slate-900"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-black text-white uppercase tracking-widest ml-4">Niveau visé</label>
                      <select className="w-full h-14 px-8 rounded-2xl bg-white focus:outline-none focus:ring-4 focus:ring-white/20 font-bold text-slate-900 appearance-none">
                         <option>B2 (Naturalisation)</option>
                         <option>B1 (Résidence)</option>
                         <option>A2 (Visa)</option>
                      </select>
                   </div>
                   <Button className="w-full h-16 bg-brand-dark text-white hover:bg-brand-dark/90 font-black text-xl rounded-2xl shadow-xl transition-all group">
                      Rejoindre la liste
                      <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" />
                   </Button>
                </form>
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
