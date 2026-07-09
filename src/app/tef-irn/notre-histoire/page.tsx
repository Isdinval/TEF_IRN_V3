"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, MapPin, GraduationCap, Sparkles, ArrowRight, CheckCircle2, FileCheck, Linkedin } from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Card } from "@/components/ui/card";
import JsonLd from "@/components/shared/JsonLd";
import { siteUrl } from "@/lib/site";

// TODO(Olivier): remplacer par l'URL Supabase/CDN de l'illustration aquarelle
// impressionniste (inspirée de Gordes, Provence)
const HERO_IMAGE_URL = "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/notre-histoire/NOUS.webp";

// TODO(Olivier): remplacer par l'URL Supabase/CDN réelle (photo/illustration d'Olivier)
const OLIVIER_PHOTO_URL = "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/notre-histoire/OLIVIER_PHOTO.webp";

// TODO(Olivier): remplacer par l'URL Supabase/CDN réelle (photo/illustration de Grecia)
const GRECIA_PHOTO_URL = "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/notre-histoire/GRECIA_PHOTO.webp";

// TODO(Olivier): remplacer par l'URL Supabase/CDN de la bannière — même format et
// même style aquarelle que HERO_IMAGE_URL (inspirée de Gordes, Provence)
const BANNER_IMAGE_URL = "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/notre-histoire/BANNER_IMAGE.webp";

const cities = [
  "Niort", "Lille", "Marseille",
];

const team = [
  {
    name: "Olivier",
    role: "Fondateur Technique · 33 ans · Français",
    bio: "Data Scientist & AI Engineer freelance, 4 ans d'expérience en Machine Learning et NLP, formé chez OpenClassrooms. Il conçoit toute l'intelligence de LlamaKusi : le coach d'expression écrite, le coach oral en temps réel, et l'algorithme de progression.",
    flag: "🇫🇷",
    photoUrl: OLIVIER_PHOTO_URL,
    linkedinUrl: "https://www.linkedin.com/in/olivier-raymond/",
  },
  {
    name: "Grecia",
    role: "Cofondatrice & Experte Utilisateur · 29 ans · Péruvienne",
    bio: "Ingénieure civile péruvienne, diplômée avec mention en atténuation des risques. Elle a travaillé en géotechnique et enseigné la gestion des risques de catastrophes, avant d'exercer aujourd'hui comme ingénieure conseil en France. Anticiper les points de rupture avant qu'ils n'arrivent — elle applique la même rigueur à l'expérience utilisateur de LlamaKusi.",
    flag: "🇵🇪",
    photoUrl: GRECIA_PHOTO_URL,
    linkedinUrl: "https://www.linkedin.com/in/grecia-raymond-huayra-mena-423b22122/",
  },
];

const timeline = [
  {
    year: "2018",
    title: "La rencontre",
    description: "Olivier et Grecia se rencontrent au Pérou, pendant un voyage de trois mois.",
  },
  {
    year: "2022",
    title: "Le mariage",
    description: "Olivier et Grecia se marient et s'installent ensemble en France.",
  },
  {
    year: "2026",
    title: "TEF IRN & lancement de LlamaKusi",
    description: "Grecia obtient son TEF IRN B2, et cette expérience donne naissance à LlamaKusi.",
  },
];

export default function NotreHistoirePage() {
  const pageUrl = `${siteUrl}/tef-irn/notre-histoire`;

  const olivierSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Olivier",
    "jobTitle": "Fondateur Technique",
    "description":
      "Data Scientist & AI Engineer freelance, cofondateur de LlamaKusi, 4 ans d'expérience en Machine Learning et NLP. Il conçoit l'architecture globale et l'intelligence artificielle de la plateforme.",
    "image": OLIVIER_PHOTO_URL,
    "nationality": "Française",
    "sameAs": ["https://www.linkedin.com/in/olivier-raymond/"],
    "worksFor": {
      "@type": "Organization",
      "name": "LlamaKusi",
      "url": siteUrl,
    },
  };

  const greciaSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Grecia",
    "jobTitle": "Cofondatrice & Experte Utilisateur",
    "description":
      "Ingénieure civile péruvienne spécialisée en atténuation des risques, cofondatrice et experte utilisateur de LlamaKusi. Son expérience personnelle du TEF IRN et de la naturalisation guide chaque fonctionnalité de la plateforme.",
    "image": GRECIA_PHOTO_URL,
    "nationality": "Péruvienne",
    "sameAs": ["https://www.linkedin.com/in/grecia-raymond-huayra-mena-423b22122/"],
    "worksFor": {
      "@type": "Organization",
      "name": "LlamaKusi",
      "url": siteUrl,
    },
  };

  const aboutPageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "Notre histoire - LlamaKusi",
    "description":
      "L'histoire d'Olivier et Grecia, fondateurs de LlamaKusi : pourquoi un ingénieur IA et une ingénieure civile ont créé le coach IA du TEF IRN à partir de leur propre parcours de naturalisation.",
    "url": pageUrl,
    "mainEntity": [
      { "@type": "Person", "name": "Olivier" },
      { "@type": "Person", "name": "Grecia" },
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Accueil",
        "item": siteUrl,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Notre histoire",
        "item": pageUrl,
      },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-brand-dark">
      <JsonLd data={aboutPageSchema} id="notre-histoire-aboutpage-schema" />
      <JsonLd data={breadcrumbSchema} id="notre-histoire-breadcrumb-schema" />
      <JsonLd data={olivierSchema} id="notre-histoire-olivier-schema" />
      <JsonLd data={greciaSchema} id="notre-histoire-grecia-schema" />
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
        </section>

        {/* Story */}
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto space-y-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            <p>
              Nous nous sommes rencontrés au Pérou, pendant un voyage de trois mois qu'Olivier
              y a fait. De cette rencontre est née une vie commune en France — et avec elle,
              dès fin 2022, une étape que nous n'avions pas anticipée : le parcours de
              naturalisation de Grecia, et l'examen qui en conditionne chaque dossier, le{" "}
              <Link
                href="/tef-irn/guides"
                className="font-semibold text-brand-blue dark:text-brand-gold underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                TEF IRN
              </Link>
              .
            </p>
            <p>
              Nous en avons été les témoins directs : des formations entre 300 et 800 € pour
              une préparation complète, un examen à repasser à 180–205 € la session en cas
              d'échec, et surtout aucun outil pour vraiment s'entraîner — aucune plateforme ne
              proposait de correction instantanée de l'expression écrite, ni de simulation
              orale interactive. Le stress, lui, était partout. Et en déménageant au fil des
              opportunités d'Olivier — {cities.slice(0, 4).join(", ")} — nous avons vu combien les démarches administratives
              et les ressources disponibles varient d'une région à l'autre, sans jamais devenir
              plus simples.
            </p>
            <p>
              C'est ce vécu — administratif et humain à la fois — que nous avons injecté dans{" "}
              <Link
                href="/tef-irn/pricing"
                className="font-semibold text-brand-blue dark:text-brand-gold underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                LlamaKusi
              </Link>
              : un coach IA qui corrige l'expression écrite en quelques secondes et
              entraîne à l'oral 24/7, pensé pour transformer une contrainte en une étape de
              réussite sereine — pour ceux qui vivent aujourd'hui ce que Grecia a vécu.
            </p>
          </div>
        </section>

        {/* Timeline */}
        <section className="pb-20 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="relative border-l-2 border-brand-blue/20 dark:border-white/10 pl-8 space-y-10">
              {timeline.map((item) => (
                <motion.div
                  key={item.year}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <span className="absolute -left-[2.55rem] top-1 flex h-4 w-4 rounded-full bg-brand-blue dark:bg-brand-gold ring-4 ring-white dark:ring-brand-dark" />
                  <div className="text-sm font-bold uppercase tracking-widest text-brand-blue dark:text-brand-gold mb-1">
                    {item.year}
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mb-1">
                    {item.title}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">{item.description}</p>
                </motion.div>
              ))}
            </div>
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
                La demande de naturalisation de Grecia est aujourd'hui en cours de constitution —
                nous vivons encore, avec vous, la suite du parcours. C'est aussi pour ça que
                LlamaKusi continue d'évoluer.
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
                  <Card className="h-full overflow-hidden p-0">
                    <img
                      src={member.photoUrl}
                      alt={`Photo de ${member.name}, ${member.role}`}
                      className="w-full h-auto object-contain bg-slate-100 dark:bg-slate-800"
                      loading="lazy"
                    />
                    <div className="p-8">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{member.flag}</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">
                        {member.name}
                      </span>
                    </div>
                    <p className="text-sm font-bold uppercase tracking-wide text-brand-blue dark:text-brand-gold mb-4">
                      {member.role}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                      {member.bio}
                    </p>
                    <a
                      href={member.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue dark:text-brand-gold hover:opacity-80 transition-opacity"
                    >
                      <Linkedin size={16} />
                      Voir le profil LinkedIn
                    </a>
                    </div>
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
              C'est notre manière de vous dire que nous ne vendons pas juste une plateforme —
              nous avons vécu la question avant de coder la réponse. Notre engagement : que
              chaque candidat qui utilise LlamaKusi arrive à son examen mieux préparé que
              nous ne l'étions.
            </p>

            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl mb-3">
              <img
                src={BANNER_IMAGE_URL}
                alt="Olivier et Grecia, fondateurs de LlamaKusi, illustration aquarelle inspirée de Gordes (Provence)"
                className="w-full h-auto object-cover aspect-[16/9] md:aspect-[2.5/1]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>


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
