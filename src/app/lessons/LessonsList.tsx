"use client";

import { useState, useMemo } from "react";
import { Lesson } from "@/lib/parcours";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  LayoutGrid,
  Brain,
  Sparkles,
  Calendar,
  Target,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

function getCategoryColor(category: string): { border: string; bg: string; text: string; icon: string } {
  const cat = category?.toLowerCase();
  if (cat?.includes('conjugaison')) return { border: 'border-l-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'bg-indigo-50 text-indigo-600' };
  if (cat?.includes('syntaxe')) return { border: 'border-l-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', icon: 'bg-violet-50 text-violet-600' };
  if (cat?.includes('vocabulaire') || cat?.includes('vocab')) return { border: 'border-l-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', icon: 'bg-amber-50 text-amber-600' };
  if (cat?.includes('grammaire')) return { border: 'border-l-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'bg-emerald-50 text-emerald-600' };
  return { border: 'border-l-zinc-300', bg: 'bg-zinc-50', text: 'text-zinc-600', icon: 'bg-zinc-50 text-zinc-500' };
}

interface LessonsListProps {
  lessons: Lesson[];
  completedLessonIds: Set<string>;
}

export default function LessonsList({ lessons, completedLessonIds }: LessonsListProps) {
  const [selectedLevel, setSelectedLevel] = useState("A2");
  const [selectedCategory, setSelectedCategory] = useState("Toutes");

  const levels = ["A2", "B1", "B2"];
  const categories = useMemo(() => {
    const cats = Array.from(new Set(lessons.map((l) => l.category)));
    return ["Toutes", ...cats];
  }, [lessons]);

  const splitTitle = (title: string) => {
    const parts = title.split(":");
    if (parts.length > 1) {
      return { main: parts[1].trim(), category: parts[0].trim() };
    }
    return { main: title, category: "" };
  };

  const parseObjective = (objective?: string) => {
    if (!objective) return { description: "" };
    return { description: objective };
  };

  const filteredLessons = lessons.filter((lesson) => {
    const matchesLevel = lesson.level === selectedLevel;
    const matchesCategory = selectedCategory === "Toutes" || lesson.category === selectedCategory;
    return matchesLevel && matchesCategory;
  });

  const nextLesson = filteredLessons.find(lesson => !completedLessonIds.has(lesson.id)) || filteredLessons[0];

  return (
    <div className="max-w-5xl mx-auto p-8 pt-16 min-h-screen">
      <header className="mb-12">
        <Badge className="bg-violet-600 mb-4 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-none shadow-lg shadow-violet-100 text-white">
          Parcours guidé
        </Badge>
        <h1 className="text-5xl font-black text-zinc-900 tracking-tighter mb-4">
          CATALOGUE DES <span className="text-violet-600">LEÇONS</span>
        </h1>
        <p className="text-zinc-500 text-lg font-medium max-w-2xl">
          Sélectionnez un niveau et une famille de compétences pour avancer pas à pas vers votre objectif TEF IRN.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <Card className="md:col-span-2 border-none shadow-2xl shadow-zinc-200/50 rounded-[3rem] p-10 bg-white">
          <div className="space-y-10">
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600">
                  <GraduationCap size={24} />
                </div>
                <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Choisir mon niveau</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`
                      h-20 rounded-2xl border-2 font-black text-xl transition-all
                      ${selectedLevel === level ? "border-violet-600 bg-violet-50 text-violet-600 shadow-inner" : "border-zinc-100 hover:border-zinc-300 text-zinc-400"}
                    `}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600">
                  <LayoutGrid size={24} />
                </div>
                <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Catégorie</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`
                      p-6 rounded-2xl border-2 text-left font-bold transition-all flex items-center justify-between capitalize
                      ${selectedCategory === category ? "border-violet-600 bg-violet-50 text-violet-900" : "border-zinc-100 hover:border-zinc-300 text-zinc-500"}
                    `}
                  >
                    {category}
                    {selectedCategory === category && <div className="w-2 h-2 bg-violet-600 rounded-full" />}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-2xl shadow-violet-100 rounded-[2.5rem] p-8 bg-gradient-to-br from-violet-600 to-indigo-700 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                <Brain size={28} />
              </div>
              <h3 className="text-2xl font-black mb-2 tracking-tight">Parcours recommandé</h3>
              <p className="text-violet-100 text-sm font-medium mb-8 leading-relaxed">
                Commencez par la première leçon disponible pour ce filtre, puis enchaînez progressivement.
              </p>
              {nextLesson ? (
                <Link href={`/lessons/${nextLesson.id}`} className="block">
                  <Button className="w-full h-14 bg-white text-violet-600 hover:bg-violet-50 font-black rounded-xl shadow-xl border-none">
                    Continuer
                  </Button>
                </Link>
              ) : (
                <Button disabled className="w-full h-14 bg-white/20 text-white font-black rounded-xl border-none">
                  Aucune leçon
                </Button>
              )}
            </div>
            <Sparkles className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12" />
          </Card>

          <Card className="border-none shadow-xl shadow-zinc-100 rounded-[2.5rem] p-8 bg-zinc-50">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="text-zinc-400" size={20} />
              <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Guide rapide</h4>
            </div>
            <div className="space-y-4">
              <p className="text-xs text-zinc-500 font-medium leading-relaxed italic">
                Les leçons sont classées par niveau CECRL et catégorie. Choisissez un filtre, puis ouvrez la carte qui correspond à votre objectif du jour.
              </p>
              <div className="h-px bg-zinc-200 w-full" />
              <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase">
                <Target size={14} className="text-violet-600" /> {filteredLessons.length} leçon{filteredLessons.length > 1 ? "s" : ""} disponible{filteredLessons.length > 1 ? "s" : ""}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
            <Badge className="bg-violet-600 rounded-full px-3 py-1 text-white border-none">Niveau {selectedLevel}</Badge>
            <span className="text-zinc-400">•</span>
            <span className="capitalize">{selectedCategory}</span>
          </h2>
          <div className="text-xs font-black text-zinc-400 uppercase tracking-widest">
            {filteredLessons.length} résultat{filteredLessons.length > 1 ? "s" : ""}
          </div>
        </div>

        {filteredLessons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLessons.map((lesson) => {
              const { main: mainTitle } = splitTitle(lesson.title);
              const { description } = parseObjective(lesson.objective);
              const isCompleted = completedLessonIds.has(lesson.id);
              const colors = getCategoryColor(lesson.category);
              const borderClass = isCompleted ? "border-l-emerald-500" : colors.border;

              return (
                <Link href={`/lessons/${lesson.id}`} key={lesson.id}>
                  <Card className={`relative border-none border-l-4 ${borderClass} shadow-xl shadow-zinc-100/70 hover:shadow-violet-100 transition-all group cursor-pointer h-full rounded-2xl overflow-hidden bg-white`}>
                    <span className="absolute top-3 right-4 text-5xl font-black opacity-[0.06] text-zinc-900 select-none pointer-events-none leading-none">{String(lesson.order_index).padStart(2,'0')}</span>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 p-7">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-black group-hover:text-violet-600 transition-colors">
                            {mainTitle}
                          </CardTitle>
                          {isCompleted && (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] h-5 px-2 rounded-full border-none font-bold uppercase tracking-wider">
                              Terminé
                            </Badge>
                          )}
                        </div>
                        <div className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${colors.bg} ${colors.text}`}>
                          {lesson.category}
                        </div>
                        {description && (
                          <p className="text-xs font-medium text-zinc-500 line-clamp-2 leading-relaxed">
                            {description}
                          </p>
                        )}
                      </div>
                      <div className={`p-2.5 rounded-xl transition-colors ${colors.icon} group-hover:bg-violet-600 group-hover:text-white`}>
                        <BookOpen size={18} />
                      </div>
                    </CardHeader>
                    <CardContent className="px-7 pb-7">
                      <div className={`flex items-center justify-between text-sm font-black ${colors.text} group-hover:translate-x-1 transition-transform`}>
                        {isCompleted ? "Revoir la leçon" : "Commencer la leçon"} <ChevronRight size={16} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-zinc-200 rounded-2xl p-10 text-center bg-zinc-50">
            <CheckCircle2 className="mx-auto mb-4 text-zinc-300" size={40} />
            <p className="font-bold text-zinc-500">Aucune leçon ne correspond encore à cette sélection.</p>
          </Card>
        )}
      </section>
    </div>
  );
}
