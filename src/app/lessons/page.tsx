"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ChevronRight, Loader2, GraduationCap } from "lucide-react";
import Link from "next/link";

interface Lesson {
  id: string;
  title: string;
  level: string;
  category: string;
  order_index: number;
}

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  A1: { bg: "bg-indigo-600", text: "text-white", border: "border-indigo-200", accent: "text-indigo-600" },
  A2: { bg: "bg-violet-600", text: "text-white", border: "border-violet-200", accent: "text-violet-600" },
  B1: { bg: "bg-emerald-600", text: "text-white", border: "border-emerald-200", accent: "text-emerald-600" },
  B2: { bg: "bg-amber-500", text: "text-white", border: "border-amber-200", accent: "text-amber-600" },
};

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLessons() {
      const { data } = await supabase
        .from('lessons')
        .select('id, title, level, category, order_index')
        .order('level', { ascending: true })
        .order('order_index', { ascending: true });

      if (data) setLessons(data);
      setLoading(false);
    }
    fetchLessons();
  }, [supabase]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="animate-spin text-indigo-600" size={36} />
    </div>
  );

  const groupedLessons = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.level]) acc[lesson.level] = [];
    acc[lesson.level].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-20">
      <div className="max-w-5xl mx-auto px-6 pt-10">

        {/* Header */}
        <header className="mb-14">
          <div className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-5">
            <GraduationCap size={13} />
            Catalogue des leçons
          </div>
          <h1 className="text-5xl font-black tracking-tight text-slate-900 leading-[1.1]">
            Maîtrisez le<br />
            <span className="text-indigo-600">français</span> pas à pas.
          </h1>
          <p className="text-slate-400 font-medium mt-4 text-lg">Du niveau A1 au niveau B2 — progressez à votre rythme.</p>
        </header>

        {/* Levels */}
        <div className="space-y-14">
          {Object.entries(groupedLessons).map(([level, levelLessons]) => {
            const colors = LEVEL_COLORS[level] || LEVEL_COLORS["A1"];
            return (
              <section key={level}>
                {/* Level header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`${colors.bg} ${colors.text} px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest`}>
                    Niveau {level}
                  </div>
                  <div className={`flex-1 h-px ${colors.border} border-t-2 border-dashed`} />
                  <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                    {levelLessons.length} leçon{levelLessons.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Lessons grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {levelLessons.map((lesson, index) => (
                    <Link href={`/lessons/${lesson.id}`} key={lesson.id}>
                      <div className="group relative bg-white border border-zinc-100 rounded-[1.5rem] p-6 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-200 cursor-pointer overflow-hidden h-full">

                        {/* Index number — decorative */}
                        <span className="absolute top-4 right-5 text-[11px] font-black text-zinc-200 group-hover:text-indigo-100 transition-colors tabular-nums">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        {/* Category badge */}
                        <div className="mb-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 capitalize">
                            {lesson.category}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-black text-slate-800 leading-snug group-hover:text-indigo-700 transition-colors pr-6">
                          {lesson.title}
                        </h3>

                        {/* CTA */}
                        <div className={`flex items-center gap-1.5 mt-5 text-[11px] font-black uppercase tracking-widest ${colors.accent} group-hover:translate-x-1 transition-transform`}>
                          Commencer <ChevronRight size={13} />
                        </div>

                        {/* Hover accent bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-[1.5rem] ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity`} />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
