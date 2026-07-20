"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, ArrowRight, BookOpen, PenTool, Pen, Mic, MessageSquare, BookText, ChevronRight, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Lesson } from "@/lib/parcours";
import { splitTitle, parseObjective } from "@/lib/lessons";

interface LessonCardProps {
  lesson: Lesson & { isCompleted?: boolean; status?: 'completed' | 'next' | 'locked' | 'open' };
  index: number;
  isNext: boolean;
  category: string;
  parcoursId: string;
}

const CATEGORY_THEMES: Record<string, { border: string, bg: string, text: string, hoverText: string, hoverIconBg: string, button: string, shadow: string, gradient: string }> = {
  conjugaison: { border: "border-blue-500", bg: "bg-blue-50", text: "text-blue-600", hoverText: "group-hover:text-blue-600", hoverIconBg: "group-hover:bg-blue-600", button: "bg-blue-600 hover:bg-blue-700", shadow: "shadow-blue-100", gradient: "from-blue-50 to-white" },
  syntaxe: { border: "border-violet-500", bg: "bg-violet-50", text: "text-violet-600", hoverText: "group-hover:text-violet-600", hoverIconBg: "group-hover:bg-violet-600", button: "bg-violet-600 hover:bg-violet-700", shadow: "shadow-violet-100", gradient: "from-violet-50 to-white" },
  vocabulaire: { border: "border-amber-500", bg: "bg-amber-50", text: "text-amber-600", hoverText: "group-hover:text-amber-600", hoverIconBg: "group-hover:bg-amber-600", button: "bg-amber-600 hover:bg-amber-700", shadow: "shadow-amber-100", gradient: "from-amber-50 to-white" },
  grammaire: { border: "border-emerald-500", bg: "bg-emerald-50", text: "text-emerald-600", hoverText: "group-hover:text-emerald-600", hoverIconBg: "group-hover:bg-emerald-600", button: "bg-emerald-600 hover:bg-emerald-700", shadow: "shadow-emerald-100", gradient: "from-emerald-50 to-white" },
  default: { border: "border-zinc-500", bg: "bg-zinc-50", text: "text-zinc-600", hoverText: "group-hover:text-zinc-600", hoverIconBg: "group-hover:bg-zinc-600", button: "bg-zinc-600 hover:bg-zinc-700", shadow: "shadow-zinc-100", gradient: "from-zinc-50 to-white" },
};

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
  const { main: mainTitle } = splitTitle(lesson.title);
  const { description } = parseObjective(lesson.objective || "");
  const Icon = categoryIcons[category.toLowerCase()] || BookOpen;
  const lessonUrl = `/tef-irn/lessons/${lesson.slug}?parcoursId=${parcoursId}`;
  const difficulty = lesson.difficulty || "facile";
  const difficultyColor = difficultyColors[difficulty as keyof typeof difficultyColors] || difficultyColors.facile;
  const theme = CATEGORY_THEMES[category.toLowerCase()] || CATEGORY_THEMES.default;

  const status = lesson.status || (lesson.isCompleted ? 'completed' : isNext ? 'next' : 'open');
  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';
  const isNextState = status === 'next';

  return (
    <motion.div
      whileHover={isLocked ? {} : { y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={isLocked ? "pointer-events-none opacity-50" : ""}
    >
      <Link href={lessonUrl} className={isLocked ? "cursor-default" : ""}>
        <Card className={`group relative overflow-hidden border-none shadow-sm transition-all duration-300 rounded-[2.5rem] border-t-4 ${theme.border} ${
          isCompleted ? `bg-gradient-to-br ${theme.gradient}` : 'bg-white'
        } ${isNextState ? 'ring-2 ring-indigo-600 ring-offset-4 shadow-2xl' : 'hover:shadow-2xl'}`}>

          <div className="absolute top-0 right-8 text-9xl font-black text-zinc-100/40 pointer-events-none z-0 select-none">
            {index + 1}
          </div>

          <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-10 relative z-10">
            {/* Icon */}
            <div className="shrink-0">
              <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-3xl transition-transform duration-500 ${!isLocked ? 'group-hover:rotate-6' : ''} ${
                isCompleted
                ? 'bg-emerald-100 text-emerald-600'
                : isNextState ? `${theme.button} text-white shadow-2xl ${theme.shadow}`
                : isLocked ? 'bg-zinc-100 text-zinc-400'
                : `bg-zinc-50 text-zinc-400 group-hover:bg-opacity-80 ${theme.hoverIconBg}`
              }`}>
                {isCompleted ? (
                  <CheckCircle2 size={48} className="text-emerald-600" />
                ) : isLocked ? (
                  <Lock size={40} />
                ) : (
                  <Icon size={40} className={isNextState ? "" : "group-hover:text-white"} />
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                {isCompleted ? (
                  <Badge className="bg-emerald-100 text-emerald-700 rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-wider border-none">
                    Terminé
                  </Badge>
                ) : isNextState ? (
                  <Badge className="bg-indigo-600 text-white rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-wider border-none">
                    À faire maintenant
                  </Badge>
                ) : isLocked ? (
                  <Badge className="bg-zinc-200 text-zinc-600 rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-wider border-none">
                    Bientôt
                  </Badge>
                ) : (
                  <Badge className={`${theme.bg} ${theme.text} rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-wider border-none`}>
                    {category}
                  </Badge>
                )}

                <div className={`flex flex-wrap items-center justify-center md:justify-start gap-4 ${isCompleted ? 'opacity-70' : ''}`}>
                  <Badge variant="secondary" className={`rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-wider border-none ${difficultyColor}`}>
                    {difficulty}
                  </Badge>
                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-black uppercase tracking-widest">
                    <Clock size={16} className="text-zinc-300" />
                    {lesson.duration || 15} min
                  </div>
                </div>
              </div>

              <h3 className={`text-lg md:text-xl font-black tracking-tight text-slate-900 ${isLocked ? '' : theme.hoverText} transition-colors`}>
                {mainTitle}
              </h3>

              {description && (
                <p className="text-sm font-medium text-slate-500 max-w-xl italic line-clamp-2">
                  {description}
                </p>
              )}
            </div>

            {/* Action */}
            <div className="shrink-0 w-full md:w-auto">
              {!isLocked && (
                <Button className={`w-full md:w-48 h-14 rounded-2xl font-black text-sm gap-2 transition-all shadow-xl ${theme.button} ${theme.shadow}`}>
                  {isCompleted ? 'REVOIR' : 'COMMENCER'}
                  <motion.div
                    animate={isNextState ? { x: [0, 4, 0] } : {}}
                    transition={isNextState ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
                  >
                    <ChevronRight size={20} />
                  </motion.div>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
