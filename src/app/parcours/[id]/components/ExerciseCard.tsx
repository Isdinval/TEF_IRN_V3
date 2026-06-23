"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, HelpCircle, AlignLeft, Edit3, Type, Headphones, Sparkles } from "lucide-react";
import Link from "next/link";
import { Exercise } from "@/lib/parcours";
import { completionCardStyles, CompletionBadge } from "@/components/ui/CompletionVisuals";

function getCategoryColor(category: string): { border: string; bg: string; text: string; icon: string } {
  const cat = category?.toLowerCase();
  if (cat?.includes('conjugaison')) return { border: 'border-l-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'bg-indigo-50 text-indigo-600' };
  if (cat?.includes('syntaxe')) return { border: 'border-l-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', icon: 'bg-violet-50 text-violet-600' };
  if (cat?.includes('vocabulaire') || cat?.includes('vocab')) return { border: 'border-l-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', icon: 'bg-amber-50 text-amber-600' };
  if (cat?.includes('grammaire')) return { border: 'border-l-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'bg-emerald-50 text-emerald-600' };
  return { border: 'border-l-zinc-300', bg: 'bg-zinc-50', text: 'text-zinc-600', icon: 'bg-zinc-50 text-zinc-500' };
}

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
  const colors = getCategoryColor(exercise.category);

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
      whileHover={{ y: -3 }}
      className="h-full"
    >
      <Card className={`group h-full border-none border-l-4 ${colors.border} shadow-sm hover:shadow-2xl transition-all duration-300 rounded-2xl flex flex-col ${completionCardStyles(!!isCompleted)}`}>
        <CardContent className="p-8 flex flex-col h-full gap-5">
          <div className="flex justify-between items-start">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm group-hover:shadow-lg ${colors.icon}`}>
              <Icon size={24} />
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
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
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
            {exercise.attempts_count && exercise.attempts_count > 0 ? (
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meilleur score</span>
                <span className={`text-2xl font-black ${colors.text}`}>
                  {exercise.success_rate || 0}%
                </span>
              </div>
            ) : (
              <Badge className="bg-zinc-100 text-zinc-500 border-none text-[10px] font-black px-3 py-1 uppercase">
                Nouveau
              </Badge>
            )}

            <div className="flex flex-col items-end">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Essais</span>
               <span className="text-xl font-black text-slate-600">
                  {exercise.attempts_count || 0}
               </span>
            </div>
          </div>

          <Link href={getExerciseUrl()} className="w-full">
            <Button className={`w-full h-11 rounded-xl text-white font-black transition-all active:scale-95 shadow-xl ${isCompleted ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 group-hover:shadow-emerald-200' : 'bg-zinc-900 hover:bg-indigo-600 shadow-zinc-100 group-hover:shadow-indigo-100'}`}>
              {isCompleted ? 'REVOIR' : 'COMMENCER'}
              <Play size={18} className="ml-2" fill="currentColor" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
