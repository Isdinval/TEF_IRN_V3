"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Star, HelpCircle, AlignLeft, Edit3, Type, Headphones, ChevronRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { Exercise, getExerciseUrl as resolveExerciseUrl } from "@/lib/parcours";

interface ExerciseCardProps {
  exercise: Exercise & { is_completed?: boolean; is_ai_generated?: boolean; recommendation_reason?: string };
  parcoursId?: string;
  /** Titre principal (sans le sous-titre) de la leçon d'origine de l'exercice.
   *  Permet de signaler visuellement que plusieurs cartes appartiennent à la
   *  même leçon sans devoir les regrouper physiquement dans la grille. */
  lessonTitle?: string;
  /** "hero" = traitement mis en avant, réservé au 1er exercice recommandé
   *  (/lessons/[slug]/complete et /parcours/[slug]).
   *  "default" (les autres cartes de la grille) affiche aussi
   *  recommendation_reason depuis l'item 5, en plus compact que le hero. */
  variant?: 'default' | 'hero';
}

const typeIcons: Record<string, any> = {
  qcm: HelpCircle,
  trous: Type,
  reformulage: Edit3,
  association: HelpCircle,
  ecrit: AlignLeft,
  oral: Headphones,
  qcm_centre_entrainement: HelpCircle,
};

const typeLabels: Record<string, string> = {
  qcm: "QCM",
  trous: "Texte à trous",
  reformulage: "Reformulation",
  association: "Association",
  ecrit: "Expression Écrite",
  oral: "Compréhension Orale",
  qcm_centre_entrainement: "Entraînement",
};

const difficultyColors: Record<string, string> = {
  facile: "bg-emerald-100 text-emerald-700",
  moyen: "bg-amber-100 text-amber-700",
  difficile: "bg-rose-100 text-rose-700",
};

const CATEGORY_THEMES: Record<string, { border: string, bg: string, text: string, hoverText: string, hoverIconBg: string, button: string, shadow: string }> = {
  conjugaison: { border: "border-blue-500", bg: "bg-blue-50", text: "text-blue-600", hoverText: "group-hover:text-blue-600", hoverIconBg: "group-hover:bg-blue-600", button: "bg-blue-600 hover:bg-blue-700", shadow: "shadow-blue-100" },
  syntaxe: { border: "border-violet-500", bg: "bg-violet-50", text: "text-violet-600", hoverText: "group-hover:text-violet-600", hoverIconBg: "group-hover:bg-violet-600", button: "bg-violet-600 hover:bg-violet-700", shadow: "shadow-violet-100" },
  vocabulaire: { border: "border-amber-500", bg: "bg-amber-50", text: "text-amber-600", hoverText: "group-hover:text-amber-600", hoverIconBg: "group-hover:bg-amber-600", button: "bg-amber-600 hover:bg-amber-700", shadow: "shadow-amber-100" },
  grammaire: { border: "border-emerald-500", bg: "bg-emerald-50", text: "text-emerald-600", hoverText: "group-hover:text-emerald-600", hoverIconBg: "group-hover:bg-emerald-600", button: "bg-emerald-600 hover:bg-emerald-700", shadow: "shadow-emerald-100" },
  default: { border: "border-zinc-500", bg: "bg-zinc-50", text: "text-zinc-600", hoverText: "group-hover:text-zinc-600", hoverIconBg: "group-hover:bg-zinc-600", button: "bg-zinc-600 hover:bg-zinc-700", shadow: "shadow-zinc-100" },
};

export default function ExerciseCard({ exercise, parcoursId, lessonTitle, variant = 'default' }: ExerciseCardProps) {
  const Icon = typeIcons[exercise.type] || HelpCircle;
  const difficulty = exercise.difficulty || "facile";
  const difficultyColor = difficultyColors[difficulty as keyof typeof difficultyColors] || difficultyColors.facile;
  const isCompleted = exercise.is_completed;
  const theme = CATEGORY_THEMES[exercise.category?.toLowerCase()] || CATEGORY_THEMES.default;

  const getExerciseUrl = () => resolveExerciseUrl(exercise, parcoursId);

  if (variant === 'hero') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        className="relative"
      >
        <div className={`absolute -inset-3 rounded-[3.5rem] ${theme.bg} opacity-70 blur-2xl -z-10`} />
        <Card className={`relative overflow-hidden border-none shadow-2xl ${theme.shadow} rounded-[3rem] bg-white`}>
          <div className="flex items-stretch">
            <div className={`w-3 shrink-0 ${theme.button}`} />
            <CardContent className="p-8 md:p-10 flex-1 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
              <div className={`w-20 h-20 rounded-[1.75rem] flex items-center justify-center shrink-0 shadow-inner ${theme.bg} ${theme.text}`}>
                <Icon size={36} />
              </div>

              <div className="flex-1 space-y-3 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${theme.text}`}>
                    {typeLabels[exercise.type] || exercise.type}
                  </span>
                  <Badge variant="outline" className={`rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-wider border-none ${difficultyColor}`}>
                    {difficulty}
                  </Badge>
                </div>

                {exercise.recommendation_reason && (
                  <p className={`text-xs font-black uppercase tracking-widest ${theme.text} flex items-center gap-1.5`}>
                    <span aria-hidden="true">✦</span> {exercise.recommendation_reason}
                  </p>
                )}

                <h3 className="text-2xl font-black text-slate-900 leading-tight">
                  {exercise.instructions}
                </h3>

                {/* Point-clé affiché seulement si recommendation_reason ne l'inclut pas déjà
                    (cf. TIER_REASONS + pointCleLabel dans recommendation-resolver.ts) --
                    évite de répéter deux fois la même information sur la carte. */}
                {!exercise.recommendation_reason && (exercise.point_cle_pedagogique || exercise.point_cles_lesson) && (
                  <p className="text-sm text-slate-400 font-medium italic leading-snug">
                    🎯 {exercise.point_cle_pedagogique || exercise.point_cles_lesson}
                  </p>
                )}
              </div>

              <Link href={getExerciseUrl()} target="_blank" rel="noopener noreferrer" className="w-full md:w-auto shrink-0">
                <Button className={`w-full md:w-auto h-16 px-10 rounded-2xl font-black text-base transition-all active:scale-95 shadow-xl ${theme.button} ${theme.shadow}`}>
                  {isCompleted ? 'REVOIR' : 'COMMENCER'}
                  <ChevronRight size={20} className="ml-2" />
                </Button>
              </Link>
            </CardContent>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      whileHover={{ y: -6, scale: 1.02 }}
      className="h-full"
    >
      <Card className={`group h-full border-none shadow-sm hover:shadow-2xl transition-all duration-300 rounded-[2.5rem] flex flex-col bg-white border-t-4 ${theme.border}`}>
        <CardContent className="p-8 flex flex-col h-full gap-5">
          <div className="flex justify-between items-start">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${theme.hoverIconBg} ${isCompleted ? 'bg-emerald-50 text-emerald-600' : `${theme.bg} ${theme.text}`}`}>
              <Icon size={28} className="group-hover:text-white" />
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline" className={`rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-wider border-none ${difficultyColor}`}>
                {difficulty}
              </Badge>
              {isCompleted && (
                <Badge className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full border-none font-bold uppercase tracking-wider">
                  Complété
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-widest ${theme.text}`}>
                {typeLabels[exercise.type] || exercise.type}
              </span>
              {exercise.is_ai_generated && (
                <Badge className="bg-amber-50 text-amber-600 border-none text-[8px] font-black px-1.5 h-4 uppercase">AI</Badge>
              )}
            </div>
            {exercise.recommendation_reason && (
              <p className={`text-[9px] font-black uppercase tracking-widest ${theme.text} flex items-center gap-1`}>
                <span aria-hidden="true">✦</span> {exercise.recommendation_reason}
              </p>
            )}
            <h4 className={`text-lg font-black text-slate-900 leading-tight ${theme.hoverText} transition-colors`}>
              {exercise.instructions}
            </h4>
            {lessonTitle && (
              <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <BookOpen size={11} className="shrink-0" />
                <span className="truncate">{lessonTitle}</span>
              </div>
            )}
            {/* Point-clé affiché seulement si recommendation_reason ne l'inclut pas déjà
                (cf. TIER_REASONS + pointCleLabel dans recommendation-resolver.ts) --
                évite de répéter deux fois la même information sur la carte. */}
            {!exercise.recommendation_reason && (exercise.point_cle_pedagogique || exercise.point_cles_lesson) && (
              <p className="text-xs text-slate-400 font-medium italic leading-snug line-clamp-2">
                🎯 {exercise.point_cle_pedagogique || exercise.point_cles_lesson}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between mt-2 pt-5 border-t border-slate-50">
            {exercise.success_rate !== undefined ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Score Max</span>
                <div className="flex items-center gap-1">
                   <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={10}
                        fill={(exercise.success_rate! / 20) >= s ? "#f59e0b" : "transparent"}
                        className={(exercise.success_rate! / 20) >= s ? "text-amber-500" : "text-zinc-200"}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-black text-slate-600 ml-1">
                    {exercise.success_rate}%
                  </span>
                </div>
              </div>
            ) : (
               <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Statut</span>
                <span className="text-xs font-black text-slate-300 uppercase">Non tenté</span>
              </div>
            )}

            <div className="flex flex-col items-end gap-1.5">
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tentatives</span>
               <span className="text-xs font-black text-slate-600">
                {exercise.attempts_count || 0}
               </span>
            </div>
          </div>

          <Link href={getExerciseUrl()} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button className={`w-full h-14 rounded-2xl font-black transition-all active:scale-95 shadow-xl ${theme.button} ${theme.shadow}`}>
              {isCompleted ? 'REVOIR' : 'COMMENCER'}
              <ChevronRight size={18} className="ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
