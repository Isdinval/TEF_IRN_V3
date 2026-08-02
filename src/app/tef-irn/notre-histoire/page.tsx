"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, MapPin, GraduationCap, Sparkles, ArrowRight, CheckCircle2, FileCheck, Linkedin, Clock, Quote } from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Card } from "@/components/ui/card";
import JsonLd from "@/components/shared/JsonLd";
import { siteUrl } from "@/lib/site";
import {
  HERO_IMAGE_URL,
  OLIVIER_PHOTO_URL,
  GRECIA_PHOTO_URL,
  BANNER_IMAGE_URL,
  MASCOT_IMAGE_URL,
} from "@/data/notre-histoire-images";

const cities = [
  "Niort", "Lille", "Marseille",
];

const team = [
  {
    name: "Olivier",
    role: "Fondateur Technique · 33 ans · Français",
    bio: "Data Scientist & AI Engineer freelance, 4 ans d'expérience en Machine Learning et NLP, formé chez OpenClassrooms. Il conçoit toute l'intelligence de LlamaKusi : le coach d'expression écrite, le coach oral en temps réel, et l'algorithme de progression.",
    flag: "fr",
    photoUrl: OLIVIER_PHOTO_URL,
    linkedinUrl: "https://www.linkedin.com/in/olivier-raymond/",
  },
  {
    name: "Grecia",
    role: "Cofondatrice & Experte Utilisateur · 29 ans · Péruvienne",
    bio: "Ingénieure civile péruvienne, diplômée avec mention en atténuation des risques. Elle a travaillé en géotechnique et enseigné la gestion des risques de catastrophes, avant d'exercer aujourd'hui comme ingénieure conseil en France. Anticiper les points de rupture avant qu'ils n'arrivent — elle applique la même rigueur à l'expérience utilisateur de LlamaKusi.",
    flag: "pe",
    photoUrl: GRECIA_PHOTO_URL,
    linkedinUrl: "https://www.linkedin.com/in/grecia-raymond-huayra-mena-423b22122/",
  },
];

// Où en est notre dossier, en toute transparence — mis à jour manuellement, pas de fausse promesse d'automatisation
const dossierChecklist: { label: string; note?: string; status: "done" | "pending" }[] = [
  { label: "Mariage depuis plus de 4 ans", note: "Mariés le 26 mars 2022", status: "done" },
  { label: "Communauté de vie établie", note: "Confirmée en juillet 2026", status: "done" },
  { label: "Niveau de français B2", note: "Grecia a obtenu son TEF IRN B2 en juin 2026", status: "done" },
  { label: "Justificatifs de communauté de vie", note: "Bail, factures, comptes joints — réunis en juillet 2026", status: "done" },
  { label: "Casier judiciaire", note: "France, Italie et Pérou — en attente du retour", status: "pending" },
  { label: "Acte d'état civil traduit", note: "Obtenu au Pérou, traduction par un traducteur assermenté en cours", status: "pending" },
  { label: "Timbre fiscal (255 €)", note: "Pas encore acheté — le dossier n'est pas complet", status: "pending" },
  { label: "Dépôt du dossier", note: "Sur l'ANEF, dès que les pièces ci-dessus seront réunies", status: "pending" },
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
              On ne veut pas qu'un autre couple vive ce qu'on a vécu : des centaines 
              d'euros gaspillés, des nuits à douter, un examen à repasser par manque 
              d'entraînement. On a créé LlamaKusi pour que vous, comme Grecia, vous 
              arriviez à votre TEF IRN avec une seule certitude : vous avez bossé 
              intelligemment.
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
          <div className="max-w-3xl mx-auto">
            <div className="relative rounded-[2.5rem] bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 p-8 md:p-14 shadow-sm">
              <Quote className="absolute top-6 right-6 md:top-8 md:right-8 text-brand-blue/10 dark:text-brand-gold/10" size={72} strokeWidth={1.5} />

              <p className="relative font-heading text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-8">
                Cher futur candidat,
              </p>

              <div className="relative space-y-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                <p className="first-letter:text-6xl first-letter:font-black first-letter:leading-[0.8] first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-brand-blue dark:first-letter:text-brand-gold">
                  On ne se connaît pas. Mais on se comprend. Toi, tu prépares le{" "}
                  <Link
                    href="/tef-irn/guides"
                    className="font-semibold text-brand-blue dark:text-brand-gold underline underline-offset-2 hover:opacity-80 transition-opacity"
                  >
                    TEF IRN
                  </Link>
                  . Nous, on l'a vécu. On s'est rencontrés au Pérou. On s'est mariés. On s'est installés en
                  France. Et puis Grecia a dit : &laquo; Je veux devenir française. &raquo; On ne savait pas ce
                  que ça impliquait. On a découvert un système qui coûte cher, qui stresse, et qui laisse les
                  gens seuls.
                </p>

                <p>
                  Des formations à 300€, 500€, 800€. Un examen à repasser à 200€.
                </p>

                <p className="text-lg font-semibold italic text-slate-900 dark:text-white border-l-4 border-brand-blue dark:border-brand-gold pl-5 py-0.5">
                  Aucun outil pour s'entraîner vraiment. Pas de correction automatique de l'écrit. Pas de
                  simulation orale. Rien. Juste du stress.
                </p>

                <p>
                  On a déménagé trois fois — {cities.slice(0, 3).join(", ")} — et partout, on a vu des candidats
                  comme toi : des gens qui bossent, qui paient, qui espèrent, et qui n'ont aucun retour.
                </p>

                <p>
                  Alors on a construit ce qu'on aurait voulu trouver :{" "}
                  <Link
                    href="/tef-irn/pricing"
                    className="font-semibold text-brand-blue dark:text-brand-gold underline underline-offset-2 hover:opacity-80 transition-opacity"
                  >
                    LlamaKusi
                  </Link>
                  , un coach IA qui corrige l'écrit en quelques secondes, qui simule l'oral 24/7, qui te donne un
                  vrai retour. On ne vend pas une plateforme. On partage ce qu'on a cherché en vain. Et si notre
                  expérience peut t'éviter une nuit blanche ou un échec... alors notre combat aura servi à
                  quelque chose.
                </p>
              </div>

              <p className="relative font-heading italic text-xl text-slate-900 dark:text-white mt-10">
                — Olivier &amp; Grecia
              </p>
            </div>
          </div>
        </section>

        {/* Pourquoi LlamaKusi */}
        <section className="pb-20 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center text-slate-900 dark:text-white mb-10">
              Pourquoi LlamaKusi ?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] gap-8 items-center">
              <img
                src={MASCOT_IMAGE_URL}
                alt="La mascotte LlamaKusi, un lama souriant portant un béret, une écharpe et un drapeau français"
                className="w-40 sm:w-48 h-auto mx-auto"
                loading="lazy"
              />
              <div className="space-y-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                <p>
                  "Kusi" veut dire "heureux", "souriant" en quechua, la langue des Andes péruviennes.
                  Grecia a grandi avec ce mot. Alors quand est venu le moment de nommer ce qu'on
                  construisait, il n'y avait pas d'autre choix : ce serait LlamaKusi, le lama heureux.
                </p>
                <p>
                  Le lama, ce n'est pas qu'un clin d'œil au Pérou de Grecia. Dans les Andes, c'est
                  l'animal qui porte les charges les plus lourdes, sur les chemins les plus longs,
                  en altitude, sans jamais se plaindre. On a trouvé que ça ressemblait beaucoup à ce
                  que vit un candidat au TEF IRN : un parcours exigeant, qu'on porte souvent seul.
                </p>
                <p>
                  Alors on a voulu qu'à défaut d'alléger le chemin, LlamaKusi le rende moins seul —
                  et qu'il te fasse sourire un peu plus souvent qu'il ne te fait douter.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="pb-20 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center text-slate-900 dark:text-white mb-14">
              Notre parcours
            </h2>
            <div className="relative border-l-2 border-brand-blue/20 dark:border-white/10 pl-8 space-y-10">
              {[
                {
                  year: "2018",
                  title: "Le coup de foudre",
                  description: "Un voyage de trois mois au Pérou. Olivier rencontre Grecia. Leur histoire commence sans savoir qu'elle les mènerait jusqu'ici."
                },
                {
                  year: "2022",
                  title: "Le choix d'une vie commune",
                  description: "Olivier et Grecia se marient. Ils s'installent en France. C'est le début d'une nouvelle vie, mais aussi d'un parcours qu'ils n'avaient pas anticipé."
                },
                {
                  year: "2026",
                  title: "La révélation",
                  description: "Grecia obtient le TEF IRN B2. Mais elle découvre que des milliers de candidats vivent les mêmes difficultés qu'elle. Avec Olivier, ils décident de créer la préparation qu'ils ont cherchée."
                }
              ].map((item) => (
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
            <Card className="p-8 items-start bg-gradient-to-br from-brand-blue/5 to-transparent dark:from-brand-gold/5">
              <GraduationCap className="text-brand-blue dark:text-brand-gold mb-3" size={28} />
              <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                Grecia a réussi
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                Elle a obtenu son TEF IRN B2. Mais elle se souvient des nuits à réviser seule, sans retour, sans outils. Ce souvenir a donné naissance à LlamaKusi.
              </p>
            </Card>
            <Card className="p-8 items-start">
              <FileCheck className="text-brand-blue dark:text-brand-gold mb-3" size={28} />
              <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                Notre dossier est encore en cours
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                On n'a pas fini le parcours. On vit encore, avec vous, les démarches, les délais, les doutes. LlamaKusi évolue avec nous, à chaque étape.
              </p>
            </Card>
          </div>
        </section>

        {/* Nos erreurs */}
        <section className="pb-20 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 justify-center mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white text-center">
                On ne vous cache pas nos erreurs
              </h2>
            </div>
            <div className="space-y-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              <p>
                On pourrait vous raconter que tout s&apos;est bien passé depuis le début. Ce ne serait pas honnête.
              </p>
              <p>
                On s&apos;est trompés de procédure. Pendant deux semaines, on s&apos;est engagés en pensant suivre
                la voie de la naturalisation par décret — celle qu&apos;on connaissait, celle dont tout le monde
                parle. On avait même commencé à préparer Grecia à l&apos;Examen Civique. Puis on a compris :
                un mariage avec un(e) Français(e) suit une autre voie, la déclaration, avec ses propres règles.
                Et sur cette voie-là, l&apos;Examen Civique n&apos;est pas obligatoire.
              </p>
              <p>
                Deux semaines à préparer le mauvais examen, pour un couple qui, comme nous, allait justement
                créer un outil de préparation. Ironique. Mais ça nous a appris une chose essentielle : dans les
                démarches de naturalisation, la première question n&apos;est pas &laquo; comment je me
                prépare ? &raquo;, c&apos;est &laquo; à quelle procédure est-ce que je réponds ? &raquo;. Deux
                personnes dans la même situation — mariées à un ou une Français(e) — peuvent suivre deux
                parcours complètement différents.
              </p>
            </div>
          </div>
        </section>

        {/* Où en est notre dossier */}
        <section className="pb-20 px-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-black text-center text-slate-900 dark:text-white mb-3">
              Où en est notre dossier ?
            </h2>
            <p className="text-center text-slate-500 dark:text-slate-400 mb-10">
              On ne l&apos;a pas encore déposé. En toute transparence, voici ce qui est fait — et ce qu&apos;il
              nous reste à faire.
            </p>
            <div className="space-y-3">
              {dossierChecklist.map((item, idx) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border ${item.status === "done" ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20"}`}
                >
                  {item.status === "done" ? (
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={22} />
                  ) : (
                    <Clock className="text-amber-500 shrink-0" size={22} />
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white text-sm leading-snug">{item.label}</p>
                    {item.note && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.note}</p>
                    )}
                  </div>
                  <span
                    className={`ml-auto shrink-0 text-[10px] font-black uppercase tracking-wide ${item.status === "done" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}
                  >
                    {item.status === "done" ? "Validé" : "En cours"}
                  </span>
                </motion.div>
              ))}
            </div>
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
                      <img
                        src={`https://flagcdn.com/w40/${member.flag}.png`}
                        srcSet={`https://flagcdn.com/w80/${member.flag}.png 2x`}
                        alt=""
                        width={28}
                        height={21}
                        className="rounded-sm shadow-sm"
                      />
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
                Je me lance
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
