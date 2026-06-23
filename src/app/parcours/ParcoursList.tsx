"use client";

import { useRouter } from "next/navigation";
import { Parcours, ParcoursProgress } from "@/lib/parcours";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, BookOpen, ChevronRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/shared/Animations";
import { User } from "@supabase/supabase-js";

interface ParcoursWithProgress extends Parcours {
  progress?: ParcoursProgress;
}

function ProgressRing({ percent, color }: { percent: number; color: string }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <div className="relative w-12 h-12 flex-shrink-0">
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="#f4f4f5" strokeWidth="4" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 24 24)" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black" style={{ color }}>
        {percent === 100 ? '✓' : `${percent}%`}
      </span>
    </div>
  );
}

function getCategoryColor(category: string): { border: string; bg: string; text: string; icon: string } {
  const cat = category?.toLowerCase();
  if (cat?.includes('conjugaison')) return { border: 'border-l-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'bg-indigo-50 text-indigo-600' };
  if (cat?.includes('syntaxe')) return { border: 'border-l-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', icon: 'bg-violet-50 text-violet-600' };
  if (cat?.includes('vocabulaire') || cat?.includes('vocab')) return { border: 'border-l-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', icon: 'bg-amber-50 text-amber-600' };
  if (cat?.includes('grammaire')) return { border: 'border-l-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'bg-emerald-50 text-emerald-600' };
  return { border: 'border-l-zinc-300', bg: 'bg-zinc-50', text: 'text-zinc-600', icon: 'bg-zinc-50 text-zinc-500' };
}

function getCategoryHex(cat: string): string {
  const category = cat?.toLowerCase();
  if (category?.includes('conjugaison')) return '#4F46E5';
  if (category?.includes('syntaxe')) return '#7C3AED';
  if (category?.includes('vocabulaire') || category?.includes('vocab')) return '#D97706';
  if (category?.includes('grammaire')) return '#059669';
  return '#71717A';
}

export default function ParcoursList({
  allParcours,
  user
}: {
  allParcours: ParcoursWithProgress[];
  user: User | null;
}) {
  const router = useRouter();

  const enCours = allParcours.filter(p => p.progress && p.progress.percent > 0 && p.progress.percent < 100);
  const termines = allParcours.filter(p => p.progress && p.progress.percent === 100);
  const aDecouvrir = allParcours.filter(p => !p.progress || p.progress.percent === 0);

  const renderSection = (title: string, items: ParcoursWithProgress[], badgeColor: string, showProgress: boolean) => {
    if (items.length === 0) return null;

    return (
      <section className="mb-16">
        <div className="flex items-center gap-4 mb-8 px-1">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <Badge className={`${badgeColor} rounded-full px-4 py-1`}>{title}</Badge>
            <span className="text-zinc-300">•</span>
            {items.length} parcours
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((p) => {
            const colors = getCategoryColor(p.category);
            const hexColor = getCategoryHex(p.category);
            const percent = p.progress?.percent ?? 0;

            return (
              <motion.div
                key={p.id}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`group cursor-pointer overflow-hidden rounded-2xl border-none border-l-4 ${colors.border} bg-white shadow-xl shadow-zinc-200/50 hover:shadow-2xl transition-all h-full`}
                  onClick={() => router.push(`/parcours/${p.id}`)}
                >
                  <CardContent className="p-8 flex flex-col h-full">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-zinc-200">
                            {p.level}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-zinc-200 capitalize">
                            {p.category}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-black text-zinc-900 capitalize leading-tight">
                          {p.category} {p.level}
                        </h3>
                      </div>
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300 ${colors.icon} group-hover:bg-indigo-600 group-hover:text-white`}>
                        {p.progress?.percent === 100 ? <Trophy size={24} /> : <BookOpen size={24} />}
                      </div>
                    </div>

                    <p className="text-sm text-zinc-500 font-medium mb-8 flex-1 line-clamp-2 italic">
                      {p.objective}
                    </p>

                    {showProgress && p.progress ? (
                      <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                        <div className="flex items-center gap-4">
                          <ProgressRing percent={percent} color={hexColor} />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Progression</span>
                            <span className="text-xs font-black text-zinc-600">
                              {p.progress.completed}/{p.progress.total} leçons
                            </span>
                          </div>
                        </div>
                        <div className={`${colors.text} group-hover:translate-x-1 transition-transform`}>
                          <ChevronRight size={20} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                        <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${colors.bg} ${colors.text}`}>
                          Découvrir le programme
                        </div>
                        <div className={`${colors.text} group-hover:translate-x-1 transition-transform`}>
                          <ChevronRight size={20} />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-zinc-50/50 p-6 pt-16 lg:p-16">
        <div className="max-w-7xl mx-auto">
          <header className="mb-16">
            <Badge className="mb-4 rounded-full border-none bg-indigo-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 text-white">
              {user ? "Mes Parcours" : "Parcours de formation"}
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter mb-6">
              {user ? (
                <>VOTRE <span className="text-indigo-600">APPRENTISSAGE</span> <br />SUR MESURE</>
              ) : (
                <>DES PARCOURS <span className="text-indigo-600">D'APPRENTISSAGE</span> <br />OPTIMISÉS</>
              )}
            </h1>
            <p className="max-w-2xl text-xl font-medium text-slate-500 leading-relaxed">
              Suivez votre progression étape par étape à travers nos modules spécialisés pour réussir le TEF IRN.
            </p>
          </header>

          {user ? (
            <>
              {renderSection("En cours", enCours, "bg-indigo-600", true)}
              {renderSection("Terminés", termines, "bg-emerald-500", true)}
              {renderSection("À découvrir", aDecouvrir, "bg-zinc-400", true)}
            </>
          ) : (
            renderSection("Tous les parcours", allParcours, "bg-indigo-600", false)
          )}

          {allParcours.length === 0 && (
            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-zinc-200">
              <Sparkles className="mx-auto text-zinc-200 mb-6" size={64} />
              <h2 className="text-2xl font-black text-zinc-900 mb-2">Aucun parcours disponible</h2>
              <p className="text-zinc-400 font-bold">Les leçons arrivent bientôt !</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
