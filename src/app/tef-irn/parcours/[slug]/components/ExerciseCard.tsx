"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, HelpCircle, AlignLeft, Edit3, Type, Headphones, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Exercise, getExerciseUrl as resolveExerciseUrl } from "@/lib/parcours";

interface ExerciseCardProps {
  exercise: Exercise & { is_completed?: boolean; is_ai_generated?: boolean; recommendation_reason?: string };
  parcoursId?: string;
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
  facile: "bg-zinc-100 text-zinc-600",
  moyen: "bg-zinc-100 text-zinc-600",
  difficile: "bg-zinc-100 text-zinc-600",
};

const CATEGORY_THEMES: Record<string, { border: string, bg: string, text: string, hoverText: string, hoverIconBg: string, button: string, shadow: string }> = {
  conjugaison: { border: "border-indigo-500", bg: "bg-indigo-50", text: "text-indigo-600", hoverText: "group-hover:text-indigo-600", hoverIconBg: "group-hover:bg-indigo-600", button: "bg-indigo-600 hover:bg-indigo-700", shadow: "shadow-indigo-100" },
  syntaxe: { border: "border-indigo-500", bg: "bg-indigo-50", text: "text-indigo-600", hoverText: "group-hover:text-indigo-600", hoverIconBg: "group-hover:bg-indigo-600", button: "bg-indigo-600 hover:bg-indigo-700", shadow: "shadow-indigo-100" },
  vocabulaire: { border: "border-indigo-500", bg: "bg-indigo-50", text: "text-indigo-600", hoverText: "group-hover:text-indigo-600", hoverIconBg: "group-hover:bg-indigo-600", button: "bg-indigo-600 hover:bg-indigo-700", shadow: "shadow-indigo-100" },
  grammaire: { border: "border-indigo-500", bg: "bg-indigo-50", text: "text-indigo-600", hoverText: "group-hover:text-indigo-600", hoverIconBg: "group-hover:bg-indigo-600", button: "bg-indigo-600 hover:bg-indigo-700", shadow: "shadow-indigo-100" },
  default: { border: "border-zinc-500", bg: "bg-zinc-50", text: "text-zinc-600", hoverText: "group-hover:text-zinc-600", hoverIconBg: "group-hover:bg-zinc-600", button: "bg-zinc-600 hover:bg-zinc-700", shadow: "shadow-zinc-100" },
};

export default function ExerciseCard({ exercise, parcoursId, variant = 'default' }: ExerciseCardProps) {
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
        whileHover={{ y: -4 }}
        className="relative"
      >
        <Card className="relative overflow-hidden border border-zinc-100 shadow-sm rounded-3xl bg-white">
          <div className="flex items-stretch">
            <div className={`w-3 shrink-0 ${theme.button}`} />
            <CardContent className="p-8 md:p-10 flex-1 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 shadow-inner ${theme.bg} ${theme.text}`}>
                <Icon size={36} />
              </div>

              <div className="flex-1 space-y-3 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-black uppercase tracking-widest ${theme.text}`}>
                    {typeLabels[exercise.type] || exercise.type}
                  </span>
                  <Badge variant="outline" className={`rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-wider border-none ${difficultyColor}`}>
                    {difficulty}
                  </Badge>
                </div>

                {exercise.recommendation_reason && (
                  <p className={`text-xs font-black uppercase tracking-widest ${theme.text} flex items-center gap-1.5`}>
                    <span aria-hidden="true">✦</span> {exercise.recommendation_reason}
                  </p>
                )}

                <h3 className="text-2xl font-black text-zinc-900 leading-tight">
                  {exercise.instructions}
                </h3>

                {/* Point-clé affiché seulement si recommendation_reason ne l'inclut pas déjà
                    (cf. TIER_REASONS + pointCleLabel dans recommendation-resolver.ts) --
                    évite de répéter deux fois la même information sur la carte. */}
                {!exercise.recommendation_reason && (exercise.point_cle_pedagogique || exercise.point_cles_lesson) && (
                  <p className="text-sm text-zinc-500 font-medium leading-snug">
                    🎯 {exercise.point_cle_pedagogique || exercise.point_cles_lesson}
                  </p>
                )}
              </div>

              <Link href={getExerciseUrl()} target="_blank" rel="noopener noreferrer" className="w-full md:w-auto shrink-0">
                <Button className={`w-full md:w-auto h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 shadow-lg ${theme.button} ${theme.shadow}`}>
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
    <Link href={getExerciseUrl()} target="_blank" rel="noopener noreferrer" className="h-full block">
      <motion.div
        layout
        whileHover={{ y: -4 }}
        className="h-full"
      >
        <Card className={`group h-full border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl flex flex-col bg-white border-t-4 ${theme.border}`}>
          <CardContent className="p-8 flex flex-col h-full gap-5">
            <div className="flex justify-between items-start">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${theme.hoverIconBg} ${isCompleted ? 'bg-emerald-50 text-emerald-600' : `${theme.bg} ${theme.text}`}`}>
                <Icon size={28} className="group-hover:text-white" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="outline" className={`rounded-full px-4 py-1 text-xs font-black uppercase tracking-wider border-none ${difficultyColor}`}>
                  {difficulty}
                </Badge>
                {isCompleted && (
                  <Badge className="bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full border-none font-bold uppercase tracking-wider">
                    Complété
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black uppercase tracking-widest ${theme.text}`}>
                  {typeLabels[exercise.type] || exercise.type}
                </span>
                {exercise.is_ai_generated && (
                  <Badge className="bg-zinc-100 text-zinc-600 border-none text-xs font-black px-2 py-0.5 rounded-full uppercase">AI</Badge>
                )}
              </div>
              {exercise.recommendation_reason && (
                <p className={`text-xs font-black uppercase tracking-widest ${theme.text} flex items-center gap-1`}>
                  <span aria-hidden="true">✦</span> {exercise.recommendation_reason}
                </p>
              )}
              <h4 className={`text-lg font-black text-zinc-900 leading-tight ${theme.hoverText} transition-colors`}>
                {exercise.instructions}
              </h4>
              {/* Point-clé affiché seulement si recommendation_reason ne l'inclut pas déjà
                  (cf. TIER_REASONS + pointCleLabel dans recommendation-resolver.ts) --
                  évite de répéter deux fois la même information sur la carte. */}
              {!exercise.recommendation_reason && (exercise.point_cle_pedagogique || exercise.point_cles_lesson) && (
                <p className="text-sm text-zinc-500 font-medium leading-snug line-clamp-2">
                  🎯 {exercise.point_cle_pedagogique || exercise.point_cles_lesson}
                </p>
              )}
            </div>

            {/* CTA visuel, pas un <button> réel : toute la carte est déjà le
                lien (fix demandé par Olivier -- l'ancien survol sur toute la
                carte laissait croire qu'elle était cliquable alors que seul
                le bouton du bas l'était). Score/tentatives retirés (logique
                de tableau de bord, pas de recommandation) sur demande d'Olivier. */}
            <div className={`flex items-center justify-between mt-2 pt-5 border-t border-zinc-50 font-black text-sm transition-colors ${theme.text}`}>
              <span>{isCompleted ? 'Revoir' : 'Commencer'}</span>
              <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
