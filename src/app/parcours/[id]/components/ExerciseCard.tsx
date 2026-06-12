"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Star, HelpCircle, AlignLeft, Edit3, Type, Headphones } from "lucide-react";
import Link from "next/link";
import { Exercise } from "@/lib/parcours";

interface ExerciseCardProps {
  exercise: Exercise & { is_completed?: boolean };
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

export default function ExerciseCard({ exercise }: ExerciseCardProps) {
  const Icon = typeIcons[exercise.type] || HelpCircle;
  const difficulty = exercise.difficulty || "facile";
  const difficultyColor = difficultyColors[difficulty as keyof typeof difficultyColors] || difficultyColors.facile;

  const getExerciseUrl = () => {
    switch (exercise.type) {
      case 'qcm':
      case 'association':
      case 'qcm_centre_entrainement':
        return `/practice?id=${exercise.id}`;
      case 'trous':
        return `/grammar-check?id=${exercise.id}`;
      case 'ecrit':
        return `/writing?id=${exercise.id}`;
      default:
        return `/practice?id=${exercise.id}`;
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className="group h-full border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl bg-white flex flex-col">
        <CardContent className="p-6 flex flex-col h-full gap-4">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
              <Icon size={24} />
            </div>
            <Badge variant="outline" className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-wider ${difficultyColor}`}>
              {difficulty}
            </Badge>
          </div>

          <div className="space-y-2 flex-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
              {typeLabels[exercise.type] || exercise.type}
            </span>
            <h4 className="font-bold text-slate-900 leading-tight line-clamp-2">
              {exercise.instructions}
            </h4>
          </div>

          {exercise.success_rate !== undefined && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={12}
                    fill={(exercise.success_rate! / 20) >= s ? "#f59e0b" : "transparent"}
                    className={(exercise.success_rate! / 20) >= s ? "text-amber-500" : "text-zinc-200"}
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold text-zinc-400">
                {exercise.attempts_count || 0} tentatives
              </span>
            </div>
          )}

          <Link href={getExerciseUrl()} className="w-full">
            <Button className="w-full h-12 rounded-xl bg-zinc-900 text-white font-black hover:bg-indigo-600 shadow-lg shadow-zinc-100 transition-all">
              Commencer
              <Play size={16} className="ml-2" fill="currentColor" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}
