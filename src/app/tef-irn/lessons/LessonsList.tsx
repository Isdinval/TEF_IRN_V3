"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Brain, Calendar, CheckCircle2, ChevronRight, GraduationCap, LayoutGrid, Target } from "lucide-react";
import Link from "next/link";
import { splitTitle, parseObjective } from "@/lib/lessons";
import { useCoachContext } from "@/contexts/CoachContext";
import { identityOf } from "@/lib/category-identity";

interface Lesson {
  slug: string;
  id: string;
  title: string;
  objective: string;
  level: string;
  category: string;
  order_index: number;
}

const chipClass = (active: boolean) =>
  `inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-black capitalize transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${
    active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
  }`;

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
    const id = identityOf(lesson.category);
    const Icon = id.icon;

    return (
      <Link
        href={`/tef-irn/lessons/${lesson.slug}`}
        key={lesson.id}
        className={`group flex h-full flex-col gap-4 rounded-3xl border border-zinc-100 border-l-4 ${id.bar} bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${id.soft} ${id.text}`}>
              <Icon size={20} aria-hidden />
            </span>
            <span className={`rounded-full ${id.soft} ${id.text} px-2.5 py-0.5 text-xs font-black uppercase tracking-widest`}>
              {lesson.category}
            </span>
            {isCompleted && (
              <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-black uppercase tracking-widest text-white">
                Terminé
              </span>
            )}
          </div>
          <span className="shrink-0 text-xs font-black uppercase tracking-widest text-zinc-500">#{lesson.order_index}</span>
        </div>

        <h3 className="text-base font-black leading-tight text-zinc-900 transition-colors group-hover:text-indigo-600">
          {mainTitle}
        </h3>
        {description && (
          <p className="line-clamp-2 text-sm font-medium leading-relaxed text-zinc-500">{description}</p>
        )}

        <span className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-black uppercase tracking-widest text-indigo-600">
          {isCompleted ? "Revoir la leçon" : "Commencer la leçon"}
          <ChevronRight size={16} aria-hidden className="transition-transform group-hover:translate-x-1" />
        </span>
      </Link>
    );
  };

  const renderSection = (title: string, items: Lesson[], badgeBg: string) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className={`${badgeBg} text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest`}>
            {title}
          </span>
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

      <div className="mb-6 space-y-4 rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <span className="flex w-44 shrink-0 items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500">
            <GraduationCap size={16} className="text-indigo-600" aria-hidden /> Choisir mon niveau
          </span>
          <div role="group" aria-label="Choisir mon niveau" className="flex flex-wrap gap-2">
            {levels.map((level) => (
              <button key={level} type="button" aria-pressed={selectedLevel === level} onClick={() => setSelectedLevel(level)} className={`${chipClass(selectedLevel === level)} min-w-14 justify-center`}>
                {level}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <span className="flex w-44 shrink-0 items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500">
            <LayoutGrid size={16} className="text-indigo-600" aria-hidden /> Catégorie
          </span>
          <div role="group" aria-label="Catégorie" className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button key={category} type="button" aria-pressed={selectedCategory === category} onClick={() => setSelectedCategory(category)} className={chipClass(selectedCategory === category)}>
                {category !== "Toutes" && <span className={`h-2.5 w-2.5 rounded-full ${identityOf(category).dot}`} aria-hidden />}
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex flex-col gap-4 rounded-3xl bg-indigo-600 p-6 text-white shadow-lg shadow-indigo-100 md:col-span-2 md:flex-row md:items-center">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <Brain size={22} aria-hidden />
          </span>
          <div className="flex-1 space-y-1">
            <h3 className="text-lg font-black uppercase tracking-tight">Parcours recommandé</h3>
            <p className="text-sm font-medium leading-relaxed text-indigo-100">
              Commencez par la première leçon disponible pour ce filtre, puis enchaînez progressivement.
            </p>
          </div>
          {nextLesson ? (
            <Link
              href={`/tef-irn/lessons/${nextLesson.slug}`}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-2xl bg-white px-6 text-sm font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50"
            >
              Continuer
            </Link>
          ) : (
            <span className="inline-flex h-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 px-6 text-sm font-black uppercase tracking-widest text-white">
              Aucune leçon
            </span>
          )}
        </div>

        <div className="space-y-3 rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Calendar className="text-zinc-500" size={18} aria-hidden />
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900">Guide rapide</h4>
          </div>
          <p className="text-sm font-medium leading-relaxed text-zinc-500">
            Les leçons sont classées par niveau CECRL et catégorie. Choisissez un filtre, puis ouvrez la carte qui correspond à votre objectif du jour.
          </p>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500">
            <Target size={14} className="text-indigo-600" aria-hidden /> {filteredLessons.length} leçon{filteredLessons.length > 1 ? "s" : ""} disponible{filteredLessons.length > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
            <span className="bg-indigo-600 rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest text-white">Niveau {selectedLevel}</span>
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
            {renderSection("Terminées", terminées, "bg-emerald-600")}
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-zinc-200 p-10 text-center">
            <CheckCircle2 className="text-zinc-500" size={40} aria-hidden />
            <p className="text-sm font-medium text-zinc-500">Aucune leçon ne correspond encore à cette sélection.</p>
            {selectedCategory !== "Toutes" && (
              <button type="button" onClick={() => setSelectedCategory("Toutes")} className="inline-flex h-11 items-center rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-900 hover:bg-zinc-50">
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}
      </section>
    </div>
    </div>
  );
}
