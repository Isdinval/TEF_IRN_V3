"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Calendar,
  History,
  ChevronRight,
  Sparkles,
  Trophy
} from "lucide-react";
import { motion } from "framer-motion";
import { ExerciseAttempt, WritingFeedback, LegacyFeedback } from "@/types/writing";

interface CorrectionCardProps {
  attempt: ExerciseAttempt;
  onClick: () => void;
  index: number;
}

export const CorrectionCard = ({ attempt, onClick, index }: CorrectionCardProps) => {
  const feedback = attempt.answers.feedback;
  const level = (feedback as WritingFeedback)?.level || (feedback as LegacyFeedback)?.level || "B1";
  const subject = attempt.answers.subject || attempt.exercise?.instructions || "Expression Écrite";

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50";
    if (score >= 50) return "text-indigo-600 bg-indigo-50";
    return "text-rose-600 bg-rose-50";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
    >
      <Card className="group cursor-pointer overflow-hidden rounded-[2rem] border-none bg-white shadow-xl shadow-zinc-100 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-100/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400 transition-all group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-200">
            <FileText size={28} />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="line-clamp-1 text-lg font-black text-zinc-900 tracking-tight">
                {subject}
              </h3>
              <Badge variant="outline" className="shrink-0 rounded-full border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                {level}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-zinc-300" />
                {new Date(attempt.created_at).toLocaleDateString('fr-FR')}
              </span>
              <span className="flex items-center gap-1.5">
                <History size={14} className="text-zinc-300" />
                {attempt.study_time_minutes > 0 ? `${attempt.study_time_minutes} min` : '5-10 min'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black ${getScoreColor(attempt.score || 0)}`}>
              {attempt.score && attempt.score >= 80 ? <Trophy size={16} /> : <Sparkles size={16} />}
              {attempt.score || 0}%
            </div>

            <Button variant="ghost" size="icon" className="rounded-full hover:bg-indigo-50 hover:text-indigo-600 hidden sm:flex">
              <ChevronRight size={24} />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
