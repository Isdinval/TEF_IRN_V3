"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, ArrowRight, BookOpen, PenTool, Pen, Mic, MessageSquare, BookText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Lesson } from "@/lib/parcours";

interface LessonCardProps {
  lesson: Lesson & { isCompleted?: boolean };
  index: number;
  isNext: boolean;
  category: string;
  parcoursId: string;
}

const categoryIcons: Record<string, any> = {
  conjugaison: BookText,
  orthographe: Pen,
  vocabulaire: BookOpen,
  syntaxe: PenTool,
  grammaire: BookText,
  "expression orale": Mic,
  "expression écrite": PenTool,
  "compréhension orale": MessageSquare,
  "compréhension écrite": BookOpen,
};

const difficultyColors: Record<string, string> = {
  facile: "bg-emerald-100 text-emerald-700",
  moyen: "bg-amber-100 text-amber-700",
  difficile: "bg-rose-100 text-rose-700",
};

export default function LessonCard({ lesson, index, isNext, category, parcoursId }: LessonCardProps) {
  const Icon = categoryIcons[category.toLowerCase()] || BookOpen;
  const lessonUrl = `/lessons/${lesson.id}?parcoursId=${parcoursId}`;
  const difficulty = lesson.difficulty || "facile";
  const difficultyColor = difficultyColors[difficulty as keyof typeof difficultyColors] || difficultyColors.facile;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Link href={lessonUrl}>
        <Card className={`group relative overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[2.5rem] ${
          lesson.isCompleted ? 'bg-emerald-50/40' : isNext ? 'bg-white ring-2 ring-indigo-600 ring-offset-4' : 'bg-white'
        }`}>
          {isNext && (
            <div className="absolute top-0 right-0">
              <div className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-bl-3xl">
                À SUIVRE
              </div>
            </div>
          )}

          <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-10">
            {/* Number and Icon */}
            <div className="relative shrink-0">
              <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-3xl transition-transform duration-500 group-hover:rotate-6 ${
                lesson.isCompleted
                ? 'bg-emerald-100 text-emerald-600'
                : isNext ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200' : 'bg-zinc-100 text-zinc-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
              }`}>
                <Icon size={40} />
              </div>
              <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-sm font-black text-slate-400 border border-slate-50">
                {index + 1}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <Badge variant="secondary" className={`rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-wider border-none ${difficultyColor}`}>
                  {difficulty}
                </Badge>
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-black uppercase tracking-widest">
                  <Clock size={16} className="text-zinc-300" />
                  {lesson.duration || 15} min
                </div>
              </div>

              <h3 className={`text-2xl md:text-3xl font-black tracking-tight ${lesson.isCompleted ? 'text-slate-600' : 'text-slate-900'}`}>
                {lesson.title}
              </h3>

              {lesson.objective && (
                <p className="text-base font-medium text-slate-500 max-w-xl italic">
                  {lesson.objective}
                </p>
              )}
            </div>

            {/* Status / Action */}
            <div className="shrink-0 flex items-center gap-6">
              {lesson.isCompleted ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                    <CheckCircle2 size={32} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Complété</span>
                </div>
              ) : (
                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                  isNext ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-zinc-50 text-zinc-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:shadow-indigo-50'
                }`}>
                  <ArrowRight size={32} className={`transition-transform duration-300 ${isNext ? 'group-hover:translate-x-2' : ''}`} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
