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
          {items.map((p) => (
            <motion.div
              key={p.id}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className="group cursor-pointer overflow-hidden rounded-[2.5rem] border-none bg-white shadow-xl shadow-zinc-200/50 hover:shadow-2xl transition-all h-full"
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
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0
                      ${p.progress?.percent === 100 ? 'bg-emerald-50 text-emerald-600' :
                        p.progress?.percent && p.progress.percent > 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-zinc-50 text-zinc-400'}`}>
                      {p.progress?.percent === 100 ? <Trophy size={24} /> : <BookOpen size={24} />}
                    </div>
                  </div>

                  <p className="text-sm text-zinc-500 font-medium mb-8 flex-1 line-clamp-2 italic">
                    {p.objective}
                  </p>

                  {showProgress && p.progress ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
                          <span>Progression</span>
                          <span>{p.progress.percent}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${p.progress.percent}%` }}
                            className={`h-full ${p.progress.percent === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                          {p.progress.completed}/{p.progress.total} leçons
                        </span>
                        <div className="text-indigo-600 group-hover:translate-x-1 transition-transform">
                          <ChevronRight size={20} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-50">
                      <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                        Découvrir le programme
                      </span>
                      <div className="text-indigo-600 group-hover:translate-x-1 transition-transform">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-zinc-50/50 p-6 pt-16 lg:p-16">
        <div className="max-w-7xl mx-auto">
          <header className="mb-16">
            <Badge className="mb-4 rounded-full border-none bg-indigo-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
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
