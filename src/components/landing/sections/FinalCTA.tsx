"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronRight, Sparkles, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="py-32 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-[4rem] bg-slate-900 p-12 md:p-24 overflow-hidden text-center text-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]"
        >
          {/* Animated Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full">
             <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-blue/30 rounded-full blur-[120px]" />
             <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-brand-purple/20 rounded-full blur-[120px]" />
          </div>

          <div className="relative z-10">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl mb-10 text-brand-gold"
            >
               <Rocket size={40} fill="currentColor" />
            </motion.div>

            <h2 className="text-4xl md:text-7xl font-black mb-8 leading-tight tracking-tight">
              Le TEF IRN ne pardonne pas <br />
              <span className="text-brand-gold">l'improvisation.</span>
            </h2>

            <p className="text-xl md:text-2xl text-slate-400 font-medium max-w-3xl mx-auto mb-16 leading-relaxed">
              87% de nos utilisateurs atteignent le niveau visé en moins de 2 mois.
              <span className="text-white font-bold"> Serez-vous le prochain citoyen français ?</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <Link href="/login?mode=signup">
                <Button className="h-20 px-12 text-2xl font-black bg-brand-blue hover:bg-brand-blue/90 text-white rounded-[2rem] shadow-2xl shadow-brand-blue/40 group relative overflow-hidden">
                  <span className="relative z-10 flex items-center gap-2">
                    Je commence mon essai gratuit
                    <ChevronRight className="group-hover:translate-x-2 transition-transform duration-300" />
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.5 }}
                  />
                </Button>
              </Link>
            </div>

            <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-sm font-black uppercase tracking-[0.2em] text-slate-500">
               <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-brand-gold" />
                  <span>Essai 7 jours gratuit</span>
               </div>
               <div className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
               <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-brand-gold" />
                  <span>Sans engagement</span>
               </div>
               <div className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
               <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-brand-gold" />
                  <span>Résultats garantis</span>
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
