"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, MapPin, GraduationCap, Sparkles, ArrowRight, CheckCircle2, FileCheck } from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Card } from "@/components/ui/card";

// TODO(Olivier): remplacer par l'URL Supabase/CDN de l'illustration Monet
// (Vieux-Port de La Rochelle, style aquarelle impressionniste)
const HERO_IMAGE_URL = "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/guides-images/codes-culturels-france.webp";

const cities = [
  "Niort", "Lille", "Clermont-Ferrand", "Marseille", "Queyras", "Nice", "Strasbourg",
];

const team = [
  {
    name: "Olivier",
    role: "Fondateur Technique · 33 ans · Français",
    bio: "Data Scientist & AI Engineer. Il conçoit l'architecture globale et l'intelligence artificielle au cœur de la plateforme — du coach d'expression écrite au coach oral temps réel.",
    flag: "🇫🇷",
  },
  {
    name: "Grecia",
    role: "Cofondatrice & Experte Utilisateur · 29 ans · Péruvienne",
    bio: "Ingénieure civile. Son expérience personnelle du TEF IRN et de la naturalisation guide chaque fonctionnalité, pour que la plateforme reste simple, humaine et efficace.",
    flag: "🇵🇪",
  },
];

export default function NotreHistoirePage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-brand-dark">
      <Header />

      <main className="flex-1 pt-20">
        {/* Hero */}
        <section className="py-20 md:py-28 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue/10 dark:bg-white/10 text-brand-blue dark:text-brand-gold text-sm font-bold uppercase tracking-widest mb-6"
            >
              <Heart size={14} />
              Notre histoire
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6"
            >
              Un projet né du vécu, pas d'une étude de marché
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto"
            >
              Olivier, ingénieur IA français, et Grecia, ingénieure civile péruvienne :
              voici pourquoi nous avons construit LlamaKusi.
            </motion.p>
          </div>
        </section>

        {/* Hero image */}
        <section className="max-w-6xl mx-auto px-6 -mt-4 mb-4">
          <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl">
            <img
              src={HERO_IMAGE_URL}
              alt="Olivier et Grecia, fondateurs de LlamaKusi, illustration aquarelle inspirée de Gordes (Provence)"
              className="w-full h-auto object-cover aspect-[16/9] md:aspect-[2.5/1]"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3 italic">
            Illustration réalisée avec l'assistance de l'IA, d'après nos photos et notre histoire personnelle.
          </p>
        </section>

        {/* Story */}
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto space-y-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              Nous nous sommes rencontrés au Pérou, pendant un voyage de trois mois qu'Olivier
              y a fait. De cette rencontre est née une vie commune en France — et avec elle,
              une étape que nous n'avions pas anticipée : le parcours de naturalisation de Grecia,
              et l'examen qui en conditionne chaque dossier, le TEF IRN.
            </p>
            <p>
              Nous en avons été les témoins directs : le stress, les formations hors de prix
              ou rigides, le manque d'outils vraiment adaptés à ce que cet examen demande.
              Pendant ce temps, partageant un amour profond pour la France, nous avons parcouru
              le pays ensemble — en vivant successivement à{" "}
              {cities.slice(0, 4).join(", ")}, et en explorant des régions qui nous sont
              chères, {cities.slice(4).join(", ")}.
            </p>
            <p>
              C'est ce vécu — administratif et humain à la fois — que nous avons injecté
              dans LlamaKusi : une solution pensée pour transformer une contrainte en une
              étape de réussite sereine, pour ceux qui vivent aujourd'hui ce que Grecia a vécu.
            </p>
          </div>
        </section>

        {/* Milestone */}
        <section className="pb-20 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="p-8 items-start">
              <GraduationCap className="text-brand-blue dark:text-brand-gold mb-3" size={28} />
              <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                TEF IRN B2 obtenu
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                Grecia a passé et réussi son propre examen — l'expérience qui a donné
                naissance à LlamaKusi.
              </p>
            </Card>
            <Card className="p-8 items-start">
              <FileCheck className="text-brand-blue dark:text-brand-gold mb-3" size={28} />
              <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                Dossier en cours
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                La demande de naturalisation de Grecia est aujourd'hui en cours de constitution.
              </p>
            </Card>
          </div>
        </section>

        {/* Team */}
        <section className="py-20 bg-slate-50 dark:bg-slate-900/30 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center text-slate-900 dark:text-white mb-14">
              L'équipe
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {team.map((member) => (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <Card className="p-8 h-full">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{member.flag}</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">
                        {member.name}
                      </span>
                    </div>
                    <p className="text-sm font-bold uppercase tracking-wide text-brand-blue dark:text-brand-gold mb-4">
                      {member.role}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {member.bio}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission + CTA */}
        <section className="py-24 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <Sparkles className="mx-auto text-brand-blue dark:text-brand-gold mb-6" size={32} />
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
              Ce n'est pas qu'une image de marque
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">
              C'est notre manière de vous dire que nous connaissons ce chemin, que nous
              l'avons parcouru, et que nous sommes à vos côtés pour le réussir — avec un
              coach IA disponible 24/7, conçu spécifiquement pour le TEF IRN.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/tef-irn/pricing"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-brand-blue text-white font-bold hover:opacity-90 transition-opacity"
              >
                Découvrir LlamaKusi
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/tef-irn/guides"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white dark:bg-white/5 ring-1 ring-slate-200 dark:ring-white/10 text-slate-900 dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
              >
                Lire nos guides gratuits
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
