"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, Calendar, CheckCircle2, ChevronRight, GraduationCap, LayoutGrid, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import { splitTitle, parseObjective } from "@/lib/lessons";
import { useCoachContext } from "@/contexts/CoachContext";

interface Lesson {
  slug: string;
  id: string;
  title: string;
  objective: string;
  level: string;
  category: string;
  order_index: number;
}

const CATEGORY_COLORS: Record<string, { border: string, bg: string, text: string, hoverText: string, hoverIconBg: string, button: string, shadow: string, cardShadow: string }> = {
  conjugaison: { border: "border-indigo-500", bg: "bg-indigo-50", text: "text-indigo-600", hoverText: "group-hover:text-indigo-600", hoverIconBg: "group-hover:bg-indigo-600", button: "bg-indigo-600 hover:bg-indigo-700", shadow: "shadow-indigo-100", cardShadow: "shadow-indigo-500/20" },
  syntaxe: { border: "border-indigo-500", bg: "bg-indigo-50", text: "text-indigo-600", hoverText: "group-hover:text-indigo-600", hoverIconBg: "group-hover:bg-indigo-600", button: "bg-indigo-600 hover:bg-indigo-700", shadow: "shadow-indigo-100", cardShadow: "shadow-indigo-500/20" },
  vocabulaire: { border: "border-indigo-500", bg: "bg-indigo-50", text: "text-indigo-600", hoverText: "group-hover:text-indigo-600", hoverIconBg: "group-hover:bg-indigo-600", button: "bg-indigo-600 hover:bg-indigo-700", shadow: "shadow-indigo-100", cardShadow: "shadow-indigo-500/20" },
  grammaire: { border: "border-indigo-500", bg: "bg-indigo-50", text: "text-indigo-600", hoverText: "group-hover:text-indigo-600", hoverIconBg: "group-hover:bg-indigo-600", button: "bg-indigo-600 hover:bg-indigo-700", shadow: "shadow-indigo-100", cardShadow: "shadow-indigo-500/20" },
  default: { border: "border-zinc-500", bg: "bg-zinc-50", text: "text-zinc-600", hoverText: "group-hover:text-zinc-600", hoverIconBg: "group-hover:bg-zinc-600", button: "bg-zinc-600 hover:bg-zinc-700", shadow: "shadow-zinc-100", cardShadow: "shadow-zinc-500/20" },
};

export default function LessonsList({ lessons, completedLessonIds }: { lessons: Lesson[], completedLessonIds: Set<string> }) {
  const { setPageContext } = useCoachContext();

  useEffect(() => {
    setPageContext({ type: "browsing", section: "lessons" });
    return () => setPageContext(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selectedLevel, setSelectedLevel] = useState("A2");
  const [selectedCategory, setSelectedCategory] = useState("Toutes");

  const levels = useMemo(() => {
    const uniqueLevels = Array.from(new Set(lessons.map((lesson) => lesson.level))).filter(Boolean);
    return uniqueLevels.length > 0 ? (uniqueLevels as string[]).sort() : ["A1", "A2", "B1", "B2"];
  }, [lessons]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(lessons.map((lesson) => lesson.category))).filter(Boolean);
    return ["Toutes", ...uniqueCategories];
  }, [lessons]);

  const filteredLessons = lessons.filter((lesson) => {
    const matchesLevel = lesson.level === selectedLevel;
    const matchesCategory = selectedCategory === "Toutes" || lesson.category === selectedCategory;
    return matchesLevel && matchesCategory;
  });

  const terminées = filteredLessons.filter(l => completedLessonIds.has(l.id));
  const àDécouvrir = filteredLessons.filter(l => !completedLessonIds.has(l.id));
  const nextLesson = àDécouvrir[0];

  const renderLessonCard = (lesson: Lesson) => {
    const { main: mainTitle } = splitTitle(lesson.title);
    const { description } = parseObjective(lesson.objective);
    const isCompleted = completedLessonIds.has(lesson.id);
    const colors = CATEGORY_COLORS[lesson.category.toLowerCase()] || CATEGORY_COLORS.default;

    return (
      <Link href={`/tef-irn/lessons/${lesson.slug}`} key={lesson.id} className="h-full rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">
        <Card className={`relative border border-zinc-100 shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all group cursor-pointer h-full rounded-3xl overflow-hidden flex flex-col bg-white border-t-4 ${colors.border}`}>
          <div className="absolute top-0 right-4 text-8xl font-black text-zinc-100/40 pointer-events-none z-0 select-none">
            {lesson.order_index}
          </div>

          <CardHeader className="relative z-10 flex flex-row items-start justify-between space-y-0 p-7 pb-4">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${colors.bg} ${colors.text} hover:bg-opacity-80 text-xs px-2 py-0.5 rounded-full border-none font-bold uppercase tracking-wider`}>
                  {lesson.category}
                </Badge>
                {isCompleted && (
                  <Badge className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full border-none font-bold uppercase tracking-wider">
                    Terminé
                  </Badge>
                )}
              </div>
              <CardTitle className={`text-base font-black ${colors.hoverText} transition-colors leading-tight`}>
                {mainTitle}
              </CardTitle>
            </div>
            <div className={`p-3 rounded-2xl transition-colors shrink-0 bg-zinc-50 ${colors.hoverIconBg} relative z-10`}>
              {isCompleted ? (
                <CheckCircle2 size={20} className={`${colors.text} group-hover:text-white`} />
              ) : (
                <BookOpen size={20} className="text-zinc-500 group-hover:text-white" />
              )}
            </div>
          </CardHeader>

          <CardContent className="relative z-10 px-7 pb-6 flex-1">
            {description && (
              <p className="text-sm font-medium text-zinc-500 line-clamp-3 leading-relaxed">
                {description}
              </p>
            )}
          </CardContent>

          <div className="mt-auto p-4 pt-0 relative z-10">
            <Button className={`w-full h-12 rounded-2xl font-black text-sm gap-2 transition-all shadow-lg ${colors.button} ${colors.shadow}`}>
              {isCompleted ? "Revoir la leçon" : "Commencer la leçon"}
              <ChevronRight size={18} />
            </Button>
          </div>
        </Card>
      </Link>
    );
  };

  const renderSection = (title: string, items: Lesson[], badgeBg: string) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Badge className={`${badgeBg} text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border-none shadow-lg shadow-zinc-100`}>
            {title}
          </Badge>
          <div className="h-px bg-zinc-100 flex-1" />
          <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">{items.length} leçon{items.length > 1 ? "s" : ""}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(renderLessonCard)}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-20">
    <div className="mx-auto max-w-5xl p-4 md:p-10 lg:p-12">
      <div className="mb-8">
        <PageHeader
          badge="Parcours guidé"
          title="Catalogue des"
          highlight="leçons"
          description="Sélectionnez un niveau et une famille de compétences pour avancer pas à pas vers votre objectif TEF IRN."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <Card className="md:col-span-2 border border-zinc-100 shadow-sm rounded-3xl p-6 md:p-10 bg-white">
          <div className="space-y-10">
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <GraduationCap size={24} />
                </div>
                <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight">Choisir mon niveau</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`
                      h-12 rounded-2xl font-black transition-all
                      ${selectedLevel === level ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"}
                    `}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <LayoutGrid size={24} />
                </div>
                <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight">Catégorie</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`
                      h-12 px-5 rounded-2xl text-left font-black transition-all flex items-center justify-between capitalize
                      ${selectedCategory === category ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"}
                    `}
                  >
                    {category}
                    {selectedCategory === category && <div className="w-2 h-2 bg-white rounded-full" />}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-lg shadow-indigo-100 rounded-3xl p-8 bg-indigo-600 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                <Brain size={28} />
              </div>
              <h3 className="text-lg font-black mb-2 tracking-tight">Parcours recommandé</h3>
              <p className="text-indigo-100 text-sm font-medium mb-8 leading-relaxed">
                Commencez par la première leçon disponible pour ce filtre, puis enchaînez progressivement.
              </p>
              {nextLesson ? (
                <Link href={`/tef-irn/lessons/${nextLesson.slug}`} className="block">
                  <Button className="w-full h-12 bg-white text-indigo-600 hover:bg-indigo-50 font-black uppercase tracking-widest text-sm rounded-2xl border-none">
                    Continuer
                  </Button>
                </Link>
              ) : (
                <Button disabled className="w-full h-12 bg-white/20 text-white font-black uppercase tracking-widest text-sm rounded-2xl border-none">
                  Aucune leçon
                </Button>
              )}
            </div>
            <Sparkles className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12" />
          </Card>

          <Card className="border border-zinc-100 shadow-sm rounded-3xl p-8 bg-white">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="text-zinc-500" size={20} />
              <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Guide rapide</h4>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                Les leçons sont classées par niveau CECRL et catégorie. Choisissez un filtre, puis ouvrez la carte qui correspond à votre objectif du jour.
              </p>
              <div className="h-px bg-zinc-200 w-full" />
              <div className="flex items-center gap-2 text-xs font-black text-zinc-500 uppercase">
                <Target size={14} className="text-indigo-600" /> {filteredLessons.length} leçon{filteredLessons.length > 1 ? "s" : ""} disponible{filteredLessons.length > 1 ? "s" : ""}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
            <Badge className="bg-indigo-600 rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest text-white border-none">Niveau {selectedLevel}</Badge>
            <span className="text-zinc-500">•</span>
            <span className="capitalize">{selectedCategory}</span>
          </h2>
          <div className="text-xs font-black text-zinc-500 uppercase tracking-widest">
            {filteredLessons.length} résultat{filteredLessons.length > 1 ? "s" : ""}
          </div>
        </div>

        {filteredLessons.length > 0 ? (
          <>
            {renderSection("À découvrir", àDécouvrir, "bg-indigo-600")}
            {renderSection("Terminées", terminées, "bg-emerald-500")}
          </>
        ) : (
          <Card className="border-dashed border-2 border-zinc-200 rounded-3xl p-10 text-center bg-zinc-50">
            <CheckCircle2 className="mx-auto mb-4 text-zinc-500" size={40} />
            <p className="font-bold text-zinc-500">Aucune leçon ne correspond encore à cette sélection.</p>
          </Card>
        )}
      </section>
    </div>
    </div>
  );
}
