"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Gift, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const products = [
  {
    name: "Peluche LlamaKuzi 🇫🇷",
    desc: "Béret, écharpe tricolore — votre mascotte porte-bonheur pour le jour de l'examen.",
    price: "29,90 €",
    img: "/merch/peluche-france.png"
  },
  {
    name: "Peluche LlamaKuzi 🇵🇪",
    desc: "Bonnet péruvien traditionnel — un clin d'œil aux racines de toute une communauté.",
    price: "29,90 €",
    img: "/merch/peluche-perou.png"
  },
  {
    name: "T-shirt « I passed TEF IRN »",
    desc: "Le t-shirt qu'on porte le jour des résultats. Parce que la réussite se célèbre.",
    price: "24,90 €",
    img: "/merch/tshirt.png"
  }
];

export function Merchandising() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleWishlistSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, product: "merchandising" })
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="py-32 px-6 bg-slate-50 dark:bg-slate-900/30 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center mb-20">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-black uppercase tracking-wider mb-6">
              <Heart size={12} fill="currentColor" />
              <span>La collection LlamaKuzi</span>
           </div>
           <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight text-slate-900 dark:text-white">
             Votre réussite mérite <br />
             <span className="text-brand-blue">d&apos;être célébrée.</span>
           </h2>
           <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl font-medium leading-relaxed">
             LlamaKuzi, notre mascotte, accompagne des milliers de candidats dans leur préparation.
             Une communauté qui se reconnaît, se motive et se soutient.
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
           {products.map((p, i) => (
             <motion.div
               key={p.name}
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.6, delay: i * 0.1 }}
               className="group rounded-[2.5rem] bg-white dark:bg-white/5 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5"
             >
                <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-white/5">
                   <Image
                     src={p.img}
                     alt={p.name}
                     fill
                     className="object-cover group-hover:scale-105 transition-transform duration-700"
                   />
                </div>
                <div className="p-8">
                   <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">{p.name}</h3>
                      <span className="shrink-0 font-black text-brand-blue dark:text-brand-gold">{p.price}</span>
                   </div>
                   <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      {p.desc}
                   </p>
                </div>
             </motion.div>
           ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto p-10 rounded-[3rem] bg-brand-blue dark:bg-brand-purple text-white flex flex-col md:flex-row items-center gap-8 text-center md:text-left"
        >
           <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center shrink-0">
              <Gift size={32} />
           </div>
           <div className="flex-1">
              <h4 className="text-xl font-black mb-1">Offre de lancement</h4>
              <p className="text-indigo-100 font-medium">
                La peluche LlamaKuzi offerte pour les 50 premiers abonnés Premium ou Super Premium.
              </p>
           </div>
           <Link href="/TEF_IRN/login?mode=signup" className="shrink-0">
              <Button className="h-14 px-8 bg-white text-brand-blue hover:bg-slate-100 font-black rounded-2xl whitespace-nowrap">
                 J&apos;en profite
              </Button>
           </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-xl mx-auto mt-10 text-center"
        >
           <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4">
             Pas encore prêt à vous abonner ? Laissez votre email pour être prévenu·e dès l&apos;ouverture de la boutique LlamaKuzi.
           </p>

           {status === "success" ? (
             <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle2 size={16} />
                Merci ! Vous serez prévenu·e en avant-première.
             </div>
           ) : (
             <form onSubmit={handleWishlistSubmit} className="flex flex-col sm:flex-row gap-3 justify-center">
                <div className="relative w-full sm:w-72">
                   <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input
                     type="email"
                     required
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     placeholder="votre@email.com"
                     className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                   />
                </div>
                <Button
                  type="submit"
                  disabled={status === "loading"}
                  className="h-12 px-6 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black rounded-xl whitespace-nowrap"
                >
                   {status === "loading" ? <Loader2 size={16} className="animate-spin" /> : "Rejoindre la liste"}
                </Button>
             </form>
           )}
           {status === "error" && (
             <p className="mt-3 text-xs font-bold text-red-500">Une erreur est survenue, réessayez dans un instant.</p>
           )}
        </motion.div>
      </div>
    </section>
  );
}
