"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Star, HelpCircle, AlignLeft, Edit3, Type, Headphones, Sparkles } from "lucide-react";
import Link from "next/link";
import { Exercise } from "@/lib/parcours";
import { completionCardStyles, CompletionBadge } from "@/components/ui/CompletionVisuals";

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
  facile: "bg-emerald-50 text-emerald-600 border-emerald-100",
  moyen: "bg-amber-50 text-amber-600 border-amber-100",
  difficile: "bg-rose-50 text-rose-600 border-rose-100",
};

export default function ExerciseCard({ exercise, parcoursId }: ExerciseCardProps) {
  const Icon = typeIcons[exercise.type] || HelpCircle;
  const difficulty = exercise.difficulty || "facile";
  const difficultyColor = difficultyColors[difficulty as keyof typeof difficultyColors] || difficultyColors.facile;
  const isCompleted = exercise.is_completed;

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
        return `/practice/${exercise.id}?${params.toString()}`;
      case 'trous':
        return `/grammar-check/${exercise.id}?${params.toString()}`;
      case 'ecrit':
        return `/writing/${exercise.id}?${params.toString()}`;
      default:
        return `/practice/${exercise.id}?${params.toString()}`;
    }
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -6, scale: 1.02 }}
      className="h-full"
    >
      <Card className={`group h-full border-none shadow-sm hover:shadow-2xl transition-all duration-300 rounded-[2rem] flex flex-col ${completionCardStyles(!!isCompleted)}`}>
        <CardContent className="p-8 flex flex-col h-full gap-5">
          <div className="flex justify-between items-start">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm group-hover:shadow-lg ${isCompleted ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-emerald-200' : 'bg-zinc-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-indigo-200'}`}>
              <Icon size={28} />
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline" className={`rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-wider border ${difficultyColor}`}>
                {difficulty}
              </Badge>
              {isCompleted && <CompletionBadge />}
            </div>
          </div>

          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600/70">
                {typeLabels[exercise.type] || exercise.type}
              </span>
              {exercise.is_ai_generated && (
                <Badge className="bg-amber-50 text-amber-600 border-none text-[8px] font-black px-1.5 h-4 uppercase">AI</Badge>
              )}
            </div>
            <h4 className="text-lg font-black text-slate-900 leading-tight">
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
                      <motion.div
                        key={s}
                        initial={false}
                        animate={{
                          scale: (exercise.success_rate! / 20) >= s ? [1, 1.3, 1] : 1,
                        }}
                      >
                        <Star
                          size={10}
                          fill={(exercise.success_rate! / 20) >= s ? "#f59e0b" : "transparent"}
                          className={(exercise.success_rate! / 20) >= s ? "text-amber-500" : "text-zinc-200"}
                        />
                      </motion.div>
                    ))}
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={exercise.success_rate}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-xs font-black text-slate-600 ml-1"
                    >
                      {exercise.success_rate}%
                    </motion.span>
                  </AnimatePresence>
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
               <AnimatePresence mode="wait">
                <motion.span
                  key={exercise.attempts_count}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  className="text-xs font-black text-slate-600"
                >
                  {exercise.attempts_count || 0}
                </motion.span>
               </AnimatePresence>
            </div>
          </div>

          <Link href={getExerciseUrl()} className="w-full">
            <Button className={`w-full h-14 rounded-2xl text-white font-black transition-all active:scale-95 shadow-xl ${isCompleted ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 group-hover:shadow-emerald-200' : 'bg-zinc-900 hover:bg-indigo-600 shadow-zinc-100 group-hover:shadow-indigo-100'}`}>
              {isCompleted ? 'REVOIR' : 'COMMENCER'}
              <Play size={18} className="ml-2" fill="currentColor" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
