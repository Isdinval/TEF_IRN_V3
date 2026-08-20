"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Users, Euro, Sparkles, PenTool, Timer, Quote, Mic2, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";

// Hauteurs fixes pour les barres audio de l'écran d'appel (pas de Math.random() : évite un mismatch d'hydratation SSR/client)
const AUDIO_BAR_HEIGHTS = [35, 60, 80, 45, 70, 30, 65, 90, 50, 75, 40, 55];

export function Hero() {
  const [activeTab, setActiveTab] = useState<"ecrit" | "oral">("oral");

  const typingWords = ["votre naturalisation", "votre dossier de résidence", "l'Examen Civique", "le TEF IRN"];
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
            className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 mb-8"
          >
            <span className="flex items-center gap-2 text-sm md:text-base font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
              <img
                src="https://flagcdn.com/w40/fr.png"
                srcSet="https://flagcdn.com/w80/fr.png 2x"
                alt=""
                width={20}
                height={15}
                className="rounded-sm"
              />
              EXAMEN CIVIQUE • TEF IRN • NATURALISATION
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 dark:text-white mb-8 leading-[0.95]"
          >
            Un coach IA pour réussir <br />
            <span className="text-brand-blue dark:text-brand-gold">
              <span className="relative inline-block min-w-[280px]">
                {currentText}
                <span className="absolute right-[-4px] top-0 bottom-0 w-1 bg-brand-blue dark:bg-brand-gold animate-pulse" />
              </span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-3xl mb-12 leading-relaxed font-medium"
          >
            Le parcours de naturalisation a deux étapes : l'Examen Civique et le TEF IRN.
            <span className="text-slate-900 dark:text-white font-bold"> LlamaKusi vous accompagne sur les deux, avec un coach IA qui corrige votre écrit et votre oral en temps réel.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link href="/tef-irn/login?mode=signup">
              <Button className="h-16 px-10 text-xl font-black bg-brand-blue hover:bg-brand-blue/90 text-white rounded-2xl shadow-2xl shadow-brand-blue/30 group">
                Commencer gratuitement
                <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-slate-400"
          >
            <div className="flex items-center gap-2">
              <Users size={16} className="text-brand-blue" />
              <span>50 000+ candidats TEF IRN / an en France</span>
            </div>
            <div className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block" />
            <div className="flex items-center gap-2">
              <Euro size={16} className="text-brand-blue" />
              <span>Dès 32,90€/mois vs 300–800€ en formation traditionnelle</span>
            </div>
            <div className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block" />
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-brand-blue" />
              <span>Le seul coach IA sur les 4 épreuves + l'Examen Civique</span>
            </div>
          </motion.div>
        </div>

        {/* === MOCKUP PRODUIT — système d'onglets, reproduction fidèle de /tef-irn/writing et /tef-irn/oral === */}
        {/* Wrapper à fond contrasté : délimite visuellement l'aperçu produit du reste de la landing page */}
        <div className="bg-slate-50 dark:bg-white/5 rounded-[3rem] py-14 px-6 md:px-12">
          <h2 className="text-center text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-8">
            Aperçu du coach
          </h2>
          <div className="flex items-center justify-center gap-2 mb-6">
            <button
              onClick={() => setActiveTab("ecrit")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-black transition-all ${activeTab === "ecrit" ? "bg-brand-blue text-white shadow-lg" : "bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"}`}
            >
              <PenTool size={14} /> Expression Écrite
            </button>
            <button
              onClick={() => setActiveTab("oral")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-black transition-all ${activeTab === "oral" ? "bg-brand-blue text-white shadow-lg" : "bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"}`}
            >
              <Mic2 size={14} /> Expression Orale
            </button>
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative w-full max-w-5xl mx-auto rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white"
          >
            {activeTab === "ecrit" ? <EcritMockup /> : <OralMockup />}
          </motion.div>

          <p className="mt-6 text-center text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-3xl mx-auto">
            Aperçu réel du coach {activeTab === "ecrit" ? "d'Expression Écrite" : "d'Expression Orale"}. Le même principe de correction guidée s&apos;applique aussi à la compréhension et aux fiches de l&apos;Examen Civique.
          </p>
        </div>
      </div>

    </section>
  );
}

// === Onglet 1 : Coach d'Expression Écrite (fidèle à /tef-irn/writing) ===
function EcritMockup() {
  return (
    <>
      {/* Barre d'entête : titre + badges Section/Niveau + timer */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 md:px-8 py-4 border-b border-zinc-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white hidden sm:block">
            <PenTool size={18} />
          </div>
          <div>
            <p className="font-black text-sm text-zinc-800 tracking-tight">Coach d&apos;Expression Écrite</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-white bg-indigo-600 rounded-full px-2.5 py-0.5">Section A</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 border border-indigo-100 bg-indigo-50/50 rounded-full px-2.5 py-0.5">Niveau A2</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-black text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-full px-3 py-1.5">
          <Timer size={13} /> 06:48
        </div>
      </div>

      {/* Sujet à traiter */}
      <div className="px-6 md:px-8 pt-6">
        <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">Sujet à traiter</p>
          <p className="text-sm text-zinc-600 font-medium leading-relaxed">
            Votre salle de sport change ses horaires d&apos;ouverture le mois prochain. Écrivez un message à un(e) ami(e) pour l&apos;informer des nouveaux horaires et lui proposer d&apos;y aller ensemble.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 mt-6">
        {/* Zone de rédaction — identifiée comme dans ZoneRedaction.tsx, avec son propre en-tête */}
        <div className="lg:col-span-3 border-t lg:border-t-0 lg:border-r border-zinc-100 flex flex-col bg-[#FAFAFA]">
          <div className="flex items-center justify-between gap-3 px-6 py-4 bg-white border-b border-zinc-100">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <PenTool size={15} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-tight text-zinc-900">Zone de rédaction</span>
                <span className="text-[10px] font-black tabular-nums rounded-full px-2 py-0.5 border text-emerald-700 bg-emerald-100 border-emerald-200">71 / 40 mots</span>
              </div>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 rounded-full px-2.5 py-1 shrink-0">Analyse terminée</span>
          </div>
          <div className="flex-1 flex flex-col justify-center p-6 md:p-8 text-[15px] text-zinc-800 leading-relaxed font-medium">
            <p>Salut,</p>
            <p className="mt-3">
              Je voulais te dire que notre salle de sport va changer ses horaires le mois prochain. Elle ouvrira de 7 h à 22 h tous les jours. Je pense que c&apos;est plus pratique pour nous.
            </p>
            <p className="mt-3">
              Est-ce que tu veux venir avec moi mardi soir après le travail ? Nous pourrons faire du sport ensemble pendant une heure. <span className="underline decoration-red-400 decoration-2 underline-offset-4 bg-red-50">Sa</span> sera plus motivant. J&apos;espère que <span className="underline decoration-red-400 decoration-2 underline-offset-4 bg-red-50">tu viendra</span> avec moi.
            </p>
            <p className="mt-3">À bientôt !</p>
          </div>
        </div>

        {/* Panneau Feedback IA — sombre, identique à FeedbackIA.tsx */}
        <div className="lg:col-span-2 p-6 md:p-8 space-y-5 bg-[#111827] text-white">
          <div className="flex items-center gap-2 font-black uppercase tracking-tighter text-xs text-white/90">
            <Sparkles size={14} className="text-indigo-400" /> Feedback IA
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">Score Global</p>
              <p className="text-2xl font-black text-white">75<span className="text-xs opacity-40">/100</span></p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-1">Niveau estimé</p>
              <p className="text-2xl font-black text-white">A2</p>
            </div>
          </div>

          {/* Message général (conseil_general) */}
          <div className="relative rounded-xl border border-white/5 bg-white/5 p-4 text-[11px] italic leading-relaxed text-zinc-300">
            <Quote className="absolute -top-2 left-4 text-white/10" size={18} fill="currentColor" />
            « Ton message est clair et bien structuré. Tu as bien respecté le sujet en informant ton ami des nouveaux horaires et en proposant d&apos;y aller ensemble. Continue à pratiquer les conjugaisons et les accords pour améliorer encore ta production écrite. »
          </div>

          <div className="flex items-center justify-between px-0.5">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Points d&apos;amélioration</p>
            <span className="text-[9px] font-black text-zinc-400 border border-white/10 rounded px-1.5 py-0.5">2 analyses</span>
          </div>

          <div className="space-y-2.5">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs mb-1.5">
                <span className="text-zinc-500 line-through">Sa sera plus motivant.</span>
                <ChevronRight size={11} className="text-zinc-600" />
                <span className="font-black italic text-emerald-400 underline decoration-2 underline-offset-2">Ça sera plus motivant.</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">Dans ce contexte, « ça » est un pronom démonstratif qui remplace une idée ou une situation. « Sa » est un adjectif possessif qui ne convient pas ici.</p>
              <span className="inline-block mt-2 text-[8px] uppercase tracking-tighter text-zinc-500 border border-white/10 rounded px-1.5 py-0.5">grammaire</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs mb-1.5">
                <span className="text-zinc-500 line-through">tu viendra</span>
                <ChevronRight size={11} className="text-zinc-600" />
                <span className="font-black italic text-emerald-400 underline decoration-2 underline-offset-2">tu viendras</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">Le verbe « venir » au futur simple pour le sujet « tu » se conjugue avec la terminaison « -as ». La forme correcte est donc « tu viendras ».</p>
              <span className="inline-block mt-2 text-[8px] uppercase tracking-tighter text-orange-400 border border-orange-400/20 rounded px-1.5 py-0.5">conjugaison</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// === Onglet 2 : Coach d'Expression Orale (fidèle à /tef-irn/oral et OralAnalysisView.tsx) ===
function OralMockup() {
  const criteria = [
    { label: "Pertinence & adéquation au sujet", value: 85 },
    { label: "Cohérence & interaction", value: 78 },
    { label: "Vocabulaire", value: 74 },
    { label: "Correction grammaticale", value: 68 },
    { label: "Aisance & fluidité", value: 80 },
  ];

  return (
    <>
      {/* Barre d'entête : titre + badges Section/Niveau + timer */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 md:px-8 py-4 border-b border-zinc-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white hidden sm:block">
            <Mic2 size={18} />
          </div>
          <div>
            <p className="font-black text-sm text-zinc-800 tracking-tight">Coach d&apos;Expression Orale</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-white bg-indigo-600 rounded-full px-2.5 py-0.5">Section A</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 border border-indigo-100 bg-indigo-50/50 rounded-full px-2.5 py-0.5">Niveau B1</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-black text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-full px-3 py-1.5">
          <Timer size={13} /> 03:12
        </div>
      </div>

      {/* Sujet à traiter */}
      <div className="px-6 md:px-8 pt-6">
        <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">Sujet à traiter</p>
          <p className="text-sm text-zinc-600 font-medium leading-relaxed">
            Vous téléphonez à la mairie pour obtenir les horaires d&apos;ouverture du service des cartes de séjour.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 mt-6">
        {/* Écran d'appel en direct — fidèle à oral/page.tsx (status "active", barres audio + cercle micro) */}
        <div className="lg:col-span-3 border-t lg:border-t-0 lg:border-r border-white/5 relative flex flex-col items-center justify-center overflow-hidden bg-slate-950 min-h-[360px]">
          {/* Barres audio animées en fond (12 barres, hauteurs fixes pour éviter tout souci d'hydratation) */}
          <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-25">
            {AUDIO_BAR_HEIGHTS.map((h, index) => (
              <div
                key={index}
                className="w-2 animate-bounce rounded-full bg-indigo-500"
                style={{
                  height: `${h}%`,
                  animationDelay: `${index * 0.1}s`,
                  animationDuration: `${0.6 + (index % 4) * 0.15}s`,
                }}
              />
            ))}
          </div>

          <div className="z-10 flex flex-col items-center gap-5 p-8">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-indigo-600 shadow-[0_0_60px_rgba(79,70,229,0.6)]">
              <Mic2 className="text-white" size={42} />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-black tracking-tight text-white">Le Coach vous écoute...</h3>
              <p className="mt-2 max-w-xs text-xs font-medium leading-relaxed text-slate-400">
                Vous parlez avec : Agent municipal (mairie)
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-1">
              <span className="h-11 flex items-center rounded-2xl border border-white/20 bg-white/10 px-6 font-black text-white text-xs">
                Quitter
              </span>
              <span className="h-11 flex items-center gap-2 rounded-2xl bg-rose-500 px-6 font-black text-white text-xs">
                <MicOff size={14} /> Couper le micro
              </span>
            </div>
          </div>
        </div>

        {/* Panneau Analyse IA — sombre, symétrique à Feedback IA, fidèle à OralAnalysisView.tsx */}
        <div className="lg:col-span-2 p-6 md:p-8 space-y-5 bg-[#111827] text-white">
          <div className="flex items-center gap-2 font-black uppercase tracking-tighter text-xs text-white/90">
            <Sparkles size={14} className="text-indigo-400" /> Analyse IA
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">Niveau estimé</p>
              <p className="text-2xl font-black text-white">B1</p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-1">Score Global</p>
              <p className="text-2xl font-black text-white">77<span className="text-xs opacity-40">/100</span></p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Détail par critère</p>
            {criteria.map((c) => (
              <div key={c.label} className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-300">
                  <span>{c.label}</span>
                  <span className="text-indigo-400 font-black">{c.value}/100</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${c.value}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Message général */}
          <div className="relative rounded-xl border border-white/5 bg-white/5 p-4 text-[11px] italic leading-relaxed text-zinc-300">
            <Quote className="absolute -top-2 left-4 text-white/10" size={18} fill="currentColor" />
            « Bonne interaction et vocabulaire adapté au contexte administratif. Travaillez les liaisons et l&apos;usage du conditionnel pour gagner en naturel. »
          </div>
        </div>
      </div>
    </>
  );
}
