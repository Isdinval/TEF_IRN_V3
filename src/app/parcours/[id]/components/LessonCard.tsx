"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, BarChart, ArrowRight, BookOpen, PenTool, Pen, Mic, MessageSquare, BookText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface LessonCardProps {
  lesson: any;
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

export default function LessonCard({ lesson, index, isNext, category, parcoursId }: LessonCardProps) {
  const Icon = categoryIcons[category.toLowerCase()] || BookOpen;
  const lessonUrl = `/lessons/${lesson.id}?parcoursId=${parcoursId}`;

  const difficultyColor = {
    facile: "bg-emerald-100 text-emerald-700",
    moyen: "bg-amber-100 text-amber-700",
    difficile: "bg-rose-100 text-rose-700",
  }[lesson.difficulty || "facile"];

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Link href={lessonUrl}>
        <Card className={`group relative overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[2rem] ${
          lesson.isCompleted ? 'bg-emerald-50/40' : isNext ? 'bg-white ring-2 ring-indigo-600 ring-offset-4' : 'bg-white'
        }`}>
          {isNext && (
            <div className="absolute top-0 right-0">
              <div className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-2xl">
                À SUIVRE
              </div>
            </div>
          )}

          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
            {/* Number and Icon */}
            <div className="relative shrink-0">
              <div className={`w-20 h-20 rounded-[1.75rem] flex items-center justify-center text-2xl transition-transform duration-500 group-hover:rotate-6 ${
                lesson.isCompleted
                ? 'bg-emerald-100 text-emerald-600'
                : isNext ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-zinc-100 text-zinc-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
              }`}>
                <Icon size={32} />
              </div>
              <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-xs font-black text-slate-400">
                {index + 1}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <Badge variant="secondary" className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-wider border-none ${difficultyColor}`}>
                  {lesson.difficulty || 'facile'}
                </Badge>
                <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
                  <Clock size={14} />
                  {lesson.duration || 15} min
                </div>
              </div>

              <h3 className={`text-xl md:text-2xl font-black tracking-tight ${lesson.isCompleted ? 'text-slate-600' : 'text-slate-900'}`}>
                {lesson.title}
              </h3>

              {lesson.objective && (
                <p className="text-sm font-medium text-slate-500 line-clamp-1 italic">
                  {lesson.objective}
                </p>
              )}
            </div>

            {/* Status / Action */}
            <div className="shrink-0 flex items-center gap-4">
              {lesson.isCompleted ? (
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Complété</span>
                </div>
              ) : (
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isNext ? 'bg-indigo-600 text-white' : 'bg-zinc-50 text-zinc-300 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                }`}>
                  <ArrowRight size={24} className={`transition-transform duration-300 ${isNext ? 'group-hover:translate-x-1' : ''}`} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
