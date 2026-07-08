"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Sparkles, Clock, ChevronRight, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Guide } from '@/types/guides';
import GuideCard from '@/components/features/guides/GuideCard';
import Link from 'next/link';

export default function GuidesList({ initialGuides }: { initialGuides: Guide[] }) {
  const [guides] = useState<Guide[]>(initialGuides);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLevel, setActiveLevel] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);

  const filteredGuides = useMemo(() => {
    return guides.filter(guide => {
      const matchesSearch =
        guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.content?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLevel = !activeLevel || guide.level?.includes(activeLevel);
      const matchesCategory = !activeCategory || guide.category === activeCategory;
      const matchesType = !activeType || guide.type === activeType;

      return matchesSearch && matchesLevel && matchesCategory && matchesType;
    });
  }, [guides, searchQuery, activeLevel, activeCategory, activeType]);

  const clearFilters = () => {
    setActiveLevel(null);
    setActiveCategory(null);
    setActiveType(null);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] selection:bg-blue-100 pb-24">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-100 py-20 px-6 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-[0.03] pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest"
          >
            <Sparkles size={14} />
            Centre de ressources
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl lg:text-7xl font-black tracking-tight text-zinc-900 leading-tight"
          >
            Tout pour réussir votre <br />
            <span className="text-blue-600">certificat TEF IRN</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 font-medium max-w-2xl mx-auto"
          >
            Guides gratuits, méthodologies d'examen, listes de vocabulaire et astuces de coach pour une préparation complète.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto relative group pt-8"
          >
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 mt-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={24} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un guide, un sujet, une règle..."
              className="w-full h-20 pl-16 pr-8 bg-white border-2 border-gray-100 rounded-[2rem] text-lg font-bold shadow-2xl shadow-gray-100 focus:border-blue-600 focus:ring-0 transition-all"
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
                {/* Levels */}
                <div className="space-y-3">
                  <p className="text-sm font-bold text-zinc-900">Niveaux</p>
                  <div className="flex flex-wrap gap-2">
                    {['A1', 'A2', 'B1', 'B2'].map(level => (
                      <button
                        key={level}
                        onClick={() => setActiveLevel(activeLevel === level ? null : level)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                          activeLevel === level
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                            : 'bg-white border-gray-100 text-slate-600 hover:border-gray-200'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-3">
                  <p className="text-sm font-bold text-zinc-900">Compétences</p>
                  <div className="space-y-2">
                    {['comprehension-orale', 'expression-orale', 'comprehension-ecrite', 'expression-ecrite'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                        className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-between ${
                          activeCategory === cat
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-white border-transparent text-slate-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="capitalize">{cat.replace('-', ' ')}</span>
                        {activeCategory === cat && <ChevronRight size={14} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Types */}
                <div className="space-y-3">
                  <p className="text-sm font-bold text-zinc-900">Type de guide</p>
                  <div className="space-y-2">
                    {['complet', 'methodologie', 'thematique', 'astuces'].map(type => (
                      <button
                        key={type}
                        onClick={() => setActiveType(activeType === type ? null : type)}
                        className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-between ${
                          activeType === type
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-white border-transparent text-slate-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="capitalize">{type}</span>
                        {activeType === type && <ChevronRight size={14} />}
                      </button>
                    ))}
                  </div>
                </div>

                {(activeLevel || activeCategory || activeType || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full text-slate-400 hover:text-red-500 font-bold"
                  >
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
                {filteredGuides.length} guide{filteredGuides.length > 1 ? 's' : ''} disponible{filteredGuides.length > 1 ? 's' : ''}
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
                      <GuideCard guide={guide} />
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
                  <Button onClick={clearFilters} className="rounded-xl font-bold">Voir tous les guides</Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Popular Section */}
      {filteredGuides.length > 0 && !searchQuery && !activeLevel && (
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-3xl font-black text-zinc-900">Nouveautés</h2>
            <div className="h-[2px] flex-grow bg-gray-100"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {initialGuides.slice(0, 4).map(guide => (
              <Link href={`/tef-irn/guides/${guide.slug}`} key={guide.id} className="group">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-blue-600 transition-all group-hover:shadow-lg group-hover:shadow-blue-50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <BookOpen size={16} />
                    </div>
                    <Badge variant="outline" className="text-[10px]">{guide.type}</Badge>
                  </div>
                  <h4 className="font-bold text-zinc-900 line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">{guide.title}</h4>
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
      <section className="mt-20 max-w-7xl mx-auto px-6">
        <div className="bg-zinc-900 rounded-[3.5rem] p-12 lg:p-20 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Sparkles size={160} className="text-blue-400" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <Badge className="bg-blue-600/20 text-blue-300 border-none font-black text-[10px] uppercase tracking-widest px-4 py-1">
              Prêt pour l'examen ?
            </Badge>
            <h2 className="text-4xl lg:text-6xl font-black tracking-tight">
              Passez de la théorie <br />à la <span className="text-blue-500">pratique</span>.
            </h2>
            <p className="text-zinc-400 text-xl font-medium leading-relaxed">
              Les guides vous donnent la carte, LlamaKusi vous donne les jambes. Entraînez-vous avec notre coach IA et obtenez votre certificat TEF IRN.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
              <Link href="/tef-irn/login">
                <Button size="lg" className="h-16 px-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95">
                  S'entraîner maintenant
                </Button>
              </Link>
              <Link href="/tef-irn/pricing">
                <Button size="lg" variant="outline" className="h-16 px-12 border-white/20 hover:bg-white/5 text-white font-bold text-lg rounded-2xl">
                  Découvrir le Premium
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
