"use client";

import { motion } from "framer-motion";
import { BookOpen, ChevronRight, Trophy, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Parcours, ParcoursProgress } from "@/lib/parcours";
import { User } from "@supabase/supabase-js";
import { PageTransition } from "@/components/shared/Animations";

interface ParcoursWithProgress extends Parcours {
  progress?: ParcoursProgress;
}

const CATEGORY_THEMES: Record<string, { color: string, bg: string, text: string, gradient: string, border: string, accentBorder: string, button: string, shadow: string }> = {
  conjugaison: { color: "text-blue-600", bg: "bg-blue-50", text: "text-blue-600", gradient: "from-blue-500/20", border: "border-blue-100", accentBorder: "border-blue-500", button: "bg-blue-600 hover:bg-blue-700", shadow: "shadow-blue-100" },
  syntaxe: { color: "text-violet-600", bg: "bg-violet-50", text: "text-violet-600", gradient: "from-violet-500/20", border: "border-violet-100", accentBorder: "border-violet-500", button: "bg-violet-600 hover:bg-violet-700", shadow: "shadow-violet-100" },
  vocabulaire: { color: "text-amber-600", bg: "bg-amber-50", text: "text-amber-600", gradient: "from-amber-500/20", border: "border-amber-100", accentBorder: "border-amber-500", button: "bg-amber-600 hover:bg-amber-700", shadow: "shadow-amber-100" },
  grammaire: { color: "text-emerald-600", bg: "bg-emerald-50", text: "text-emerald-600", gradient: "from-emerald-500/20", border: "border-emerald-100", accentBorder: "border-emerald-500", button: "bg-emerald-600 hover:bg-emerald-700", shadow: "shadow-emerald-100" },
  default: { color: "text-zinc-600", bg: "bg-zinc-50", text: "text-zinc-600", gradient: "from-zinc-500/20", border: "border-zinc-100", accentBorder: "border-zinc-500", button: "bg-zinc-600 hover:bg-zinc-700", shadow: "shadow-zinc-100" },
};

function CircularProgress({ percent, colorClass }: { percent: number, colorClass: string }) {
  const radius = 28;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-16 h-16 shrink-0">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-zinc-100"
        />
        <motion.circle
          cx="32"
          cy="32"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={colorClass}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[11px] font-black text-zinc-900">{Math.round(percent)}%</span>
    </div>
  );
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
            <Badge className={`${badgeColor} rounded-full px-4 py-1 border-none shadow-lg shadow-zinc-100`}>{title}</Badge>
            <span className="text-zinc-300">•</span>
            {items.length} parcours
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((p) => {
            const theme = CATEGORY_THEMES[p.category?.toLowerCase()] || CATEGORY_THEMES.default;
            const isCompleted = p.progress?.percent === 100;

            // TASK 2 Logic
            const isInProgress = p.progress?.status === 'in_progress' || (p.progress?.started_at != null);
            const buttonLabel = isCompleted ? "Complété" : (isInProgress ? "Continuer" : "Commencer");

            return (
              <motion.div
                key={p.id}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={`group cursor-pointer overflow-hidden rounded-[2.5rem] bg-white shadow-xl shadow-zinc-200/50 hover:shadow-2xl transition-all h-full relative border-none border-t-4 ${theme.accentBorder}`}
                  onClick={() => router.push(`/parcours/${p.id}`)}
                >
                  <div className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-b ${theme.gradient} to-transparent opacity-60`} />

                  <CardContent className="p-8 flex flex-col h-full relative z-10">
                    <div className="mb-6 flex items-start justify-between">
                      <div className="space-y-3 flex-1 mr-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest bg-white/80 backdrop-blur-sm ${theme.border}`}>
                            {p.level}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest capitalize bg-white/80 backdrop-blur-sm ${theme.border}`}>
                            {p.category}
                          </Badge>
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-zinc-900 capitalize leading-tight mb-1">
                            {p.nom_parcours || `${p.category} ${p.level}`}
                          </h3>
                          {p.justification_reference_au_referentiel && p.justification_reference_au_referentiel.trim() !== "" && (
                            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 leading-snug mb-3">
                              {p.justification_reference_au_referentiel}
                            </p>
                          )}
                        </div>
                      </div>

                      {showProgress && p.progress ? (
                        <CircularProgress percent={p.progress.percent} colorClass={isCompleted ? "text-emerald-500" : theme.color} />
                      ) : (
                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${theme.bg} ${theme.text}`}>
                          <BookOpen size={28} />
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-zinc-500 font-medium mb-8 flex-1 line-clamp-3 italic leading-relaxed">
                      {p.objective}
                    </p>

                    <div className="flex items-center justify-between pt-6 border-t border-zinc-50 mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                          {showProgress && p.progress ? "Progression" : "Nouveau programme"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-zinc-900 uppercase">
                            {showProgress && p.progress ? `${p.progress.completed}/${p.progress.total} leçons` : "Prêt à commencer"}
                          </span>
                          {isCompleted && (
                            <div className="relative flex items-center justify-center">
                              <Trophy size={16} className="text-amber-500 animate-pulse" />
                              <div className="absolute inset-0 bg-amber-400 blur-md opacity-20 animate-pulse" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-lg ${isCompleted ? "bg-emerald-500 text-white shadow-emerald-100" : `${theme.button} text-white ${theme.shadow}`}`}>
                        <span>{buttonLabel}</span>
                        <ChevronRight size={16} />
                      </div>
                    </div>
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
