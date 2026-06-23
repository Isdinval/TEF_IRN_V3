"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, BookOpen, PenTool, Pen, Mic, MessageSquare, BookText, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Lesson } from "@/lib/parcours";
import { splitTitle, parseObjective } from "@/lib/lessons";

interface LessonCardProps {
  lesson: Lesson & { isCompleted?: boolean };
  index: number;
  isNext: boolean;
  category: string;
  parcoursId: string;
}

const CATEGORY_THEMES: Record<string, { border: string, bg: string, text: string, hoverText: string, hoverIconBg: string, button: string, shadow: string, ring: string, hoverShadow: string }> = {
  conjugaison: { border: "border-blue-500", bg: "bg-blue-50", text: "text-blue-600", hoverText: "group-hover:text-blue-600", hoverIconBg: "group-hover:bg-blue-600", button: "bg-blue-600 hover:bg-blue-700", shadow: "shadow-blue-100", ring: "ring-blue-500", hoverShadow: "hover:shadow-blue-200" },
  syntaxe: { border: "border-violet-500", bg: "bg-violet-50", text: "text-violet-600", hoverText: "group-hover:text-violet-600", hoverIconBg: "group-hover:bg-violet-600", button: "bg-violet-600 hover:bg-violet-700", shadow: "shadow-violet-100", ring: "ring-violet-500", hoverShadow: "hover:shadow-violet-200" },
  vocabulaire: { border: "border-amber-500", bg: "bg-amber-50", text: "text-amber-600", hoverText: "group-hover:text-amber-600", hoverIconBg: "group-hover:bg-amber-600", button: "bg-amber-600 hover:bg-amber-700", shadow: "shadow-amber-100", ring: "ring-amber-500", hoverShadow: "hover:shadow-amber-200" },
  grammaire: { border: "border-emerald-500", bg: "bg-emerald-50", text: "text-emerald-600", hoverText: "group-hover:text-emerald-600", hoverIconBg: "group-hover:bg-emerald-600", button: "bg-emerald-600 hover:bg-emerald-700", shadow: "shadow-emerald-100", ring: "ring-emerald-500", hoverShadow: "hover:shadow-emerald-200" },
  orthographe: { border: "border-rose-500", bg: "bg-rose-50", text: "text-rose-600", hoverText: "group-hover:text-rose-600", hoverIconBg: "group-hover:bg-rose-600", button: "bg-rose-600 hover:bg-rose-700", shadow: "shadow-rose-100", ring: "ring-rose-500", hoverShadow: "hover:shadow-rose-200" },
  default: { border: "border-zinc-500", bg: "bg-zinc-50", text: "text-zinc-600", hoverText: "group-hover:text-zinc-600", hoverIconBg: "group-hover:bg-zinc-600", button: "bg-zinc-600 hover:bg-zinc-700", shadow: "shadow-zinc-100", ring: "ring-zinc-500", hoverShadow: "hover:shadow-zinc-200" },
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
  const lessonUrl = `/lessons/${lesson.id}?parcoursId=${parcoursId}`;
  const difficulty = lesson.difficulty || "facile";
  const difficultyColor = difficultyColors[difficulty as keyof typeof difficultyColors] || difficultyColors.facile;
  const theme = CATEGORY_THEMES[category.toLowerCase()] || CATEGORY_THEMES.default;

  const isCompleted = lesson.isCompleted;

  const getCardStyle = (isCompleted: boolean, isNext: boolean, theme: any) => {
    if (isCompleted) {
      return {
        card: "bg-zinc-50 opacity-80 border-t-4 border-emerald-400 shadow-sm",
        icon: "bg-emerald-100 text-emerald-600",
        title: "text-zinc-400 line-through",
        button: "bg-emerald-500 hover:bg-emerald-600 text-white",
        label: "REVOIR",
        badge: null
      };
    }
    if (isNext) {
      return {
        card: `bg-white border-t-4 ${theme.border} ring-2 ring-offset-2 ${theme.ring} shadow-md`,
        icon: `${theme.button} text-white shadow-lg`,
        title: "text-slate-900 font-black",
        button: `${theme.button} ${theme.shadow}`,
        label: "COMMENCER",
        badge: (
          <Badge className={`absolute top-4 right-4 ${theme.button} text-white border-none rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider z-20`}>
            ➜ À faire
          </Badge>
        )
      };
    }
    return {
      card: `bg-white border-t-4 ${theme.border} shadow-sm opacity-90`,
      icon: "bg-zinc-100 text-zinc-400",
      title: "text-slate-700",
      button: "bg-zinc-200 text-zinc-500 hover:bg-zinc-300",
      label: "COMMENCER",
      badge: null
    };
  };

  const styles = getCardStyle(!!isCompleted, isNext, theme);

  return (
    <motion.div
      whileHover={isCompleted ? undefined : { y: isNext ? -4 : -2, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Link href={lessonUrl}>
        <Card className={`group relative overflow-hidden border-none transition-all duration-300 rounded-[2.5rem] hover:shadow-2xl ${styles.card}`}>
          {styles.badge}
          <div className="absolute top-0 right-8 text-9xl font-black text-zinc-100/40 pointer-events-none z-0 select-none">
            {index + 1}
          </div>

          <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-10 relative z-10">
            {/* Icon */}
            <div className="shrink-0">
              <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-3xl transition-transform duration-500 group-hover:rotate-6 ${styles.icon}`}>
                {isCompleted ? <CheckCircle2 size={40} className="group-hover:text-white" /> : <Icon size={40} className="group-hover:text-white" />}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <Badge className={`${theme.bg} ${theme.text} rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-wider border-none`}>
                  {category}
                </Badge>
                <Badge variant="secondary" className={`rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-wider border-none ${difficultyColor}`}>
                  {difficulty}
                </Badge>
                <div className="flex items-center gap-2 text-zinc-400 text-xs font-black uppercase tracking-widest">
                  <Clock size={16} className="text-zinc-300" />
                  {lesson.duration || 15} min
                </div>
              </div>

              <h3 className={`text-2xl md:text-3xl font-black tracking-tight ${styles.title} ${!isCompleted ? theme.hoverText : ''} transition-colors`}>
                {mainTitle}
              </h3>

              {description && (
                <p className="text-base font-medium text-slate-500 max-w-xl italic line-clamp-2">
                  {description}
                </p>
              )}
            </div>

            {/* Action */}
            <div className="shrink-0 w-full md:w-auto">
              <Button className={`w-full md:w-48 h-14 rounded-2xl font-black text-sm gap-2 transition-all shadow-xl ${styles.button}`}>
                {styles.label}
                <ChevronRight size={20} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
