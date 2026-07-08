"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Star, HelpCircle, AlignLeft, Edit3, Type, Headphones, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Exercise } from "@/lib/parcours";

interface ExerciseCardProps {
  exercise: Exercise & { is_completed?: boolean; tags?: string[]; is_ai_generated?: boolean };
  parcoursId?: string;
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

export default function ExerciseCard({ exercise, parcoursId }: ExerciseCardProps) {
  const Icon = typeIcons[exercise.type] || HelpCircle;
  const difficulty = exercise.difficulty || "facile";
  const difficultyColor = difficultyColors[difficulty as keyof typeof difficultyColors] || difficultyColors.facile;
  const isCompleted = exercise.is_completed;
  const theme = CATEGORY_THEMES[exercise.category?.toLowerCase()] || CATEGORY_THEMES.default;

  const getExerciseUrl = () => {
    const params = new URLSearchParams({
      topic: exercise.category,
      level: exercise.level
    });

    if (parcoursId) {
      params.set("parcoursId", parcoursId);
    }

    switch (exercise.type) {
      case 'qcm':
      case 'association':
      case 'qcm_centre_entrainement':
        return `/tef-irn/practice/${exercise.id}?${params.toString()}`;
      case 'trous':
        return `/tef-irn/grammar-check/${exercise.id}?${params.toString()}`;
      case 'ecrit':
        return `/tef-irn/writing/${exercise.id}?${params.toString()}`;
      default:
        return `/tef-irn/practice/${exercise.id}?${params.toString()}`;
    }
  };

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
            <h4 className={`text-lg font-black text-slate-900 leading-tight ${theme.hoverText} transition-colors`}>
              {exercise.instructions}
            </h4>
            {exercise.tags && exercise.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {exercise.tags.map(tag => (
                  <span key={tag} className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md capitalize">
                    #{tag}
                  </span>
                ))}
              </div>
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

          <Link href={getExerciseUrl()} className="w-full">
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
