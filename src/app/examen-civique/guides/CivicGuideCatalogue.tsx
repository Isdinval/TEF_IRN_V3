"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Sparkles, Clock, ChevronRight, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import GuideCard from "@/components/features/guides/GuideCard";
import { useCivicContext } from "@/components/features/examen-civique/useCivicContext";
import { CIVIC_GENERAL_GUIDE_CATEGORY, guideCategoryForMention } from "@/lib/civic-guide-categories";
import { MENTIONS } from "@/lib/civic-constants";
import type { Guide, GuideType } from "@/types/guides";

const GUIDE_TYPES: { value: GuideType; label: string }[] = [
  { value: "complet", label: "Complet" },
  { value: "thematique", label: "Thématique" },
  { value: "astuces", label: "Astuces" },
  { value: "methodologie", label: "Méthodologie" },
];

function CivicGuideCatalogueContent({ guides }: { guides: Guide[] }) {
  const { mention } = useCivicContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMention, setActiveMention] = useState<string | null>(mention || null);
  const [activeType, setActiveType] = useState<GuideType | null>(null);

  const filteredGuides = useMemo(() => {
    return guides.filter((guide) => {
      const matchesSearch =
        guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.content?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMention =
        !activeMention || guide.category === CIVIC_GENERAL_GUIDE_CATEGORY || guide.category === guideCategoryForMention(activeMention);

      const matchesType = !activeType || guide.type === activeType;

      return matchesSearch && matchesMention && matchesType;
    });
  }, [guides, searchQuery, activeMention, activeType]);

  const clearFilters = () => {
    setActiveMention(null);
    setActiveType(null);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] selection:bg-indigo-100 pb-24">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-100 py-16 px-6 overflow-hidden relative">
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest"
          >
            <Sparkles size={14} />
            Guides examen civique
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl lg:text-6xl font-black tracking-tight text-zinc-900 leading-tight"
          >
            Tout comprendre sur <br />
            <span className="text-indigo-600">l'examen civique</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-500 font-medium max-w-2xl mx-auto"
          >
            Naturalisation, carte de résident, carte de séjour pluriannuelle : des guides gratuits pour comprendre votre démarche avant de vous entraîner.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto relative group pt-4"
          >
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 mt-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un guide, une démarche, un sujet..."
              className="w-full h-16 pl-14 pr-8 bg-white border-2 border-gray-100 rounded-[2rem] text-base font-bold shadow-xl shadow-gray-100 focus:border-indigo-600 focus:ring-0 transition-all"
            />
          </motion.div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-72 space-y-10 shrink-0">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Filter size={14} /> Filtres
              </h3>

              <div className="space-y-8">
                {/* Démarche */}
                <div className="space-y-3">
                  <p className="text-sm font-bold text-zinc-900">Démarche</p>
                  <div className="space-y-2">
                    {MENTIONS.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setActiveMention(activeMention === m.value ? null : m.value)}
                        className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-between ${
                          activeMention === m.value
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                            : "bg-white border-transparent text-slate-500 hover:bg-gray-50"
                        }`}
                      >
                        <span>{m.label}</span>
                        {activeMention === m.value && <ChevronRight size={14} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type */}
                <div className="space-y-3">
                  <p className="text-sm font-bold text-zinc-900">Type de guide</p>
                  <div className="space-y-2">
                    {GUIDE_TYPES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setActiveType(activeType === t.value ? null : t.value)}
                        className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-between ${
                          activeType === t.value
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                            : "bg-white border-transparent text-slate-500 hover:bg-gray-50"
                        }`}
                      >
                        <span>{t.label}</span>
                        {activeType === t.value && <ChevronRight size={14} />}
                      </button>
                    ))}
                  </div>
                </div>

                {(activeMention || activeType || searchQuery) && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full text-slate-400 hover:text-rose-500 font-bold">
                    Réinitialiser
                  </Button>
                )}
              </div>
            </div>
          </aside>

          {/* Guides Grid */}
          <div className="flex-grow">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-zinc-900">
                {filteredGuides.length} guide{filteredGuides.length > 1 ? "s" : ""} disponible{filteredGuides.length > 1 ? "s" : ""}
              </h2>
            </div>

            <AnimatePresence mode="popLayout">
              {filteredGuides.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {filteredGuides.map((guide, i) => (
                    <motion.div
                      key={guide.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2, delay: i * 0.05 }}
                    >
                      <GuideCard guide={guide} hrefBase="/examen-civique/guides" accent="indigo" target="_blank" />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100"
                >
                  <div className="p-6 bg-gray-50 rounded-full text-gray-300 mb-6">
                    <Search size={48} />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-2">Aucun guide trouvé</h3>
                  <p className="text-slate-500 mb-8">Essayez de modifier vos filtres ou votre recherche.</p>
                  <Button onClick={clearFilters} className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700">Voir tous les guides</Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Nouveautés */}
      {filteredGuides.length > 0 && !searchQuery && !activeMention && !activeType && (
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-3xl font-black text-zinc-900">Nouveautés</h2>
            <div className="h-[2px] flex-grow bg-gray-100"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {guides.slice(0, 4).map((guide) => (
              <Link
                href={`/examen-civique/guides/${guide.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                key={guide.id}
                className="group"
              >
                <div className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-indigo-600 transition-all group-hover:shadow-lg group-hover:shadow-indigo-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Sparkles size={16} />
                    </div>
                    <Badge variant="outline" className="text-[10px]">{guide.type}</Badge>
                  </div>
                  <h4 className="font-bold text-zinc-900 line-clamp-2 group-hover:text-indigo-600 transition-colors mb-2">{guide.title}</h4>
                  <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <Clock size={12} className="mr-1" /> {guide.reading_time} min
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="mt-4 max-w-7xl mx-auto px-6">
        <div className="bg-zinc-900 rounded-[3.5rem] p-12 lg:p-20 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Sparkles size={160} className="text-indigo-400" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <Badge className="bg-indigo-600/20 text-indigo-300 border-none font-black text-[10px] uppercase tracking-widest px-4 py-1">
              Prêt à passer à l'action ?
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-black tracking-tight">
              Les guides vous donnent la théorie, <br />à vous la <span className="text-indigo-500">pratique</span>.
            </h2>
            <p className="text-zinc-400 text-xl font-medium leading-relaxed">
              Entraînez-vous gratuitement avec les questions officielles du Ministère de l'Intérieur, sans inscription requise.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
              <Link href="/examen-civique/entrainement">
                <Button size="lg" className="h-16 px-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95">
                  S'entraîner maintenant <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>
              <Link href="/examen-civique">
                <Button size="lg" variant="outline" className="h-16 px-12 border-white/20 bg-transparent hover:bg-white/5 text-white font-bold text-lg rounded-2xl">
                  Retour à l'accueil
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function CivicGuideCatalogue({ guides }: { guides: Guide[] }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAFA]" />}>
      <CivicGuideCatalogueContent guides={guides} />
    </Suspense>
  );
}
