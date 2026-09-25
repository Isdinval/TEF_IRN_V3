"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Circle, CircleDot, Lock, PenTool, Mic, ClipboardCheck, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LevelProgression, LevelStep, ParcoursStepStatus } from "@/lib/progression";
import { useCoachContext } from "@/contexts/CoachContext";

interface ProgressionInteractiveProps {
  levels: LevelProgression[];
  currentLevel: string;
}

interface LessonItem {
  id: string;
  title: string;
  orderIndex: number;
  isCompleted: boolean;
  unlocked: boolean;
  exercises: { id: string; type: string; isCompleted: boolean; url: string }[];
}

type LessonsState = LessonItem[] | "error";

const CATEGORY_LABEL: Record<string, string> = {
  grammaire: "Grammaire",
  conjugaison: "Conjugaison",
  syntaxe: "Syntaxe",
  vocabulaire: "Vocabulaire",
};

// Justification pédagogique affichée une seule fois, dans l'en-tête du
// panneau détail du parcours sélectionné (remplace les (i) répétés sur
// chaque ligne).
const CATEGORY_WHY: Record<string, string> = {
  grammaire: "Les règles qui structurent vos phrases (accords, temps, structures) — la base évaluée dans toutes les épreuves du TEF IRN.",
  conjugaison: "Maîtriser les verbes à chaque temps est indispensable à l'oral comme à l'écrit — une erreur de conjugaison se voit immédiatement.",
  syntaxe: "L'ordre des mots et la construction de phrases complexes : souvent ce qui distingue un niveau B1 d'un niveau B2.",
  vocabulaire: "Le lexique thématique attendu à ce niveau — sans vocabulaire, même une grammaire parfaite ne suffit pas à répondre aux questions.",
};
const DEFAULT_CATEGORY_WHY = "Une compétence évaluée au TEF IRN, à consolider avant de passer au niveau suivant.";

const EXERCISE_GROUPS: { type: string; short: string; label: string }[] = [
  { type: "qcm", short: "QCM", label: "Exercice QCM" },
  { type: "trous", short: "Erreurs", label: "Exercice Chasse à l'erreur" },
];

type StepState = "done" | "current" | "todo";

function isStepDone(step: LevelStep): boolean {
  return step.kind === "parcours" ? step.data.isCompleted : step.data.done;
}

function parcoursOf(level: LevelProgression | undefined): ParcoursStepStatus[] {
  if (!level) return [];
  return level.steps.flatMap((s) => (s.kind === "parcours" ? [s.data] : []));
}

/** Parcours "en cours" = premier parcours non terminé du niveau. */
function currentParcoursId(level: LevelProgression | undefined): string | null {
  const parcours = parcoursOf(level);
  return (parcours.find((p) => !p.isCompleted) ?? parcours[0])?.id ?? null;
}

function parcoursTitle(p: ParcoursStepStatus): string {
  return CATEGORY_LABEL[p.category.toLowerCase()] || p.category;
}

/**
 * Lien du bouton "Reprendre" : première étape non faite du niveau. Pour un
 * parcours, on vise directement le premier exercice non fait des leçons
 * débloquées (si déjà chargées), sinon la page du parcours.
 */
function nextActionHref(level: LevelProgression, lessonsByParcours: Record<string, LessonsState>): string | null {
  const next = level.steps.find((s) => !isStepDone(s));
  if (!next) return null;
  if (next.kind !== "parcours") return next.data.href;
  const lessons = lessonsByParcours[next.data.id];
  if (Array.isArray(lessons)) {
    const exercise = lessons
      .filter((l) => l.unlocked && !l.isCompleted)
      .flatMap((l) => l.exercises)
      .find((ex) => !ex.isCompleted);
    if (exercise) return exercise.url;
  }
  return `/tef-irn/parcours/${next.data.slug}`;
}

function LevelProgressBar({ steps }: { steps: LevelStep[] }) {
  const nextIndex = steps.findIndex((s) => !isStepDone(s));
  return (
    <div className="flex gap-1" aria-hidden="true">
      {steps.map((step, i) => (
        <div
          key={i}
          className={cn(
            "h-2 flex-1 rounded-sm",
            isStepDone(step) ? "bg-emerald-500" : i === nextIndex ? "bg-indigo-600" : "bg-zinc-200"
          )}
        />
      ))}
    </div>
  );
}

async function fetchLessons(parcoursId: string): Promise<LessonsState> {
  try {
    const res = await fetch(`/api/progression/parcours-catalogue?parcoursId=${parcoursId}`);
    if (!res.ok) throw new Error("fetch failed");
    const json = await res.json();
    return json.lessons as LessonItem[];
  } catch {
    return "error";
  }
}

function StatusIcon({ state, size = 16 }: { state: StepState; size?: number }) {
  if (state === "done") return <CheckCircle2 size={size} className="text-emerald-500 shrink-0" />;
  if (state === "current") return <CircleDot size={size} className="text-indigo-600 shrink-0" />;
  return <Circle size={size} className="text-zinc-300 shrink-0" />;
}

function ExerciseDots({ exercises }: { exercises: LessonItem["exercises"] }) {
  return (
    <div className="flex items-center gap-3 shrink-0">
      {EXERCISE_GROUPS.map((group) => {
        const items = exercises.filter((ex) => ex.type === group.type);
        if (items.length === 0) return null;
        return (
          <div key={group.type} className="flex items-center gap-0.5">
            <span className="text-[11px] font-medium text-zinc-400 mr-1">{group.short}</span>
            {items.map((ex, i) => {
              const label = `${group.label} ${i + 1} — ${ex.isCompleted ? "fait" : "à faire"}`;
              return (
                <Link key={ex.id} href={ex.url} aria-label={label} title={label} className="p-1 group">
                  <span
                    className={cn(
                      "block h-2.5 w-2.5 rounded-full border transition-colors",
                      ex.isCompleted
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-zinc-300 group-hover:border-indigo-600"
                    )}
                  />
                </Link>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function LessonRow({ lesson }: { lesson: LessonItem }) {
  if (!lesson.unlocked) {
    return (
      <div className="flex items-center gap-3 py-2.5 border-b border-zinc-100 last:border-b-0">
        <Lock size={14} className="text-zinc-300 shrink-0" />
        <p className="text-sm text-zinc-400 truncate">{lesson.title}</p>
      </div>
    );
  }
  const started = lesson.exercises.some((ex) => ex.isCompleted);
  const state: StepState = lesson.isCompleted ? "done" : started ? "current" : "todo";
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 border-b border-zinc-100 last:border-b-0">
      <StatusIcon state={state} size={14} />
      <p className="flex-1 min-w-0 text-sm text-zinc-900 truncate">{lesson.title}</p>
      {lesson.exercises.length > 0 ? (
        <ExerciseDots exercises={lesson.exercises} />
      ) : (
        <p className="text-xs text-zinc-400 italic">Aucun exercice</p>
      )}
    </div>
  );
}

function ParcoursDetail({
  parcours,
  level,
  isCurrent,
  lessons,
  onRetry,
}: {
  parcours: ParcoursStepStatus;
  level: string;
  isCurrent: boolean;
  lessons: LessonsState | undefined;
  onRetry: () => void;
}) {
  const state: StepState = parcours.isCompleted ? "done" : isCurrent ? "current" : "todo";
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <StatusIcon state={state} size={18} />
          <h2 className="flex-1 text-lg font-bold text-zinc-900">
            Parcours {parcoursTitle(parcours)} {level}
          </h2>
          {isCurrent && !parcours.isCompleted && (
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">Vous êtes ici</span>
          )}
        </div>
        <p className="text-sm text-zinc-500">
          {parcours.completed}/{parcours.total} leçons terminées
        </p>
        <p className="text-xs text-zinc-400">
          {CATEGORY_WHY[parcours.category.toLowerCase()] || DEFAULT_CATEGORY_WHY}
        </p>
      </div>

      {lessons === undefined && (
        <div className="space-y-2 pt-1">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      )}
      {lessons === "error" && (
        <p className="text-sm text-zinc-500">
          Impossible de charger le détail.{" "}
          <button onClick={onRetry} className="underline underline-offset-2">Réessayer</button>
        </p>
      )}
      {Array.isArray(lessons) && (
        lessons.length > 0 ? (
          <div>{lessons.map((lesson) => <LessonRow key={lesson.id} lesson={lesson} />)}</div>
        ) : (
          <p className="text-sm text-zinc-400 italic">Aucune leçon dans ce parcours pour l&apos;instant.</p>
        )
      )}
    </div>
  );
}

function LevelMap({
  level,
  selectedId,
  currentId,
  onSelect,
}: {
  level: LevelProgression;
  selectedId: string | null;
  currentId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <nav aria-label={`Étapes du niveau ${level.level}`} className="space-y-0.5">
      {level.steps.map((step, i) => {
        if (step.kind === "parcours") {
          const p = step.data;
          const state: StepState = p.isCompleted ? "done" : p.id === currentId ? "current" : "todo";
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              aria-current={p.id === selectedId ? "true" : undefined}
              className={cn(
                "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                p.id === selectedId ? "bg-zinc-100 font-semibold text-zinc-900" : "text-zinc-700 hover:bg-zinc-50"
              )}
            >
              <StatusIcon state={state} />
              <span className="flex-1 truncate">{parcoursTitle(p)}</span>
              <span className="text-xs text-zinc-400">{p.completed}/{p.total}</span>
            </button>
          );
        }

        const done = step.data.done;
        const { icon: Icon, label } =
          step.kind === "ee"
            ? { icon: PenTool, label: `Expression Écrite — ${step.data.section}` }
            : step.kind === "eo"
              ? { icon: Mic, label: `Expression Orale — ${step.data.section}` }
              : { icon: ClipboardCheck, label: "Examen blanc" };
        return (
          <Link
            key={`${step.kind}-${i}`}
            href={step.data.href}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-50"
          >
            <StatusIcon state={done ? "done" : "todo"} />
            <Icon size={14} className="shrink-0 text-zinc-400" />
            <span className="flex-1 truncate">{label}</span>
            {done ? <span className="text-xs text-zinc-400">Fait</span> : <ChevronRight size={14} className="shrink-0 text-zinc-300" />}
          </Link>
        );
      })}
    </nav>
  );
}

export default function ProgressionInteractive({ levels, currentLevel }: ProgressionInteractiveProps) {
  const initialLevel = levels.some((l) => l.level === currentLevel) ? currentLevel : levels[0]?.level ?? "";
  const [activeLevel, setActiveLevel] = useState<string>(initialLevel);
  const [selectedId, setSelectedId] = useState<string | null>(
    currentParcoursId(levels.find((l) => l.level === initialLevel))
  );
  const [lessonsByParcours, setLessonsByParcours] = useState<Record<string, LessonsState>>({});
  const requested = useRef(new Set<string>());
  const { setPageContext } = useCoachContext();

  const level = levels.find((l) => l.level === activeLevel);
  const currentId = currentParcoursId(level);
  const selected = parcoursOf(level).find((p) => p.id === selectedId);

  const load = (parcoursId: string) => {
    requested.current.add(parcoursId);
    fetchLessons(parcoursId).then((result) =>
      setLessonsByParcours((prev) => ({ ...prev, [parcoursId]: result }))
    );
  };

  const retry = (parcoursId: string) => {
    setLessonsByParcours((prev) => {
      const next = { ...prev };
      delete next[parcoursId];
      return next;
    });
    load(parcoursId);
  };

  // Préchargement en parallèle de tous les parcours du niveau affiché : le
  // changement de parcours dans la carte est ensuite instantané.
  useEffect(() => {
    parcoursOf(levels.find((l) => l.level === activeLevel))
      .filter((p) => !requested.current.has(p.id))
      .forEach((p) => load(p.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLevel, levels]);

  useEffect(() => {
    setPageContext({
      type: "progression",
      currentLevel,
      levelsSummary: levels.map((l) => ({
        level: l.level,
        completedSteps: l.steps.filter(isStepDone).length,
        totalSteps: l.steps.length,
        isLevelComplete: l.isLevelComplete,
      })),
    });
    return () => setPageContext(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levels, currentLevel]);

  const handleLevelChange = (value: string) => {
    setActiveLevel(value);
    setSelectedId(currentParcoursId(levels.find((l) => l.level === value)));
  };

  const hasChecklist = level?.steps.some((s) => s.kind !== "parcours") ?? false;
  const nextHref = level ? nextActionHref(level, lessonsByParcours) : null;

  return (
    <div className="max-w-5xl mx-auto p-6 py-12 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight">Ma progression</h1>
        <p className="text-sm text-zinc-500 font-medium">
          Le chemin complet vers le TEF IRN, niveau par niveau : parcours, expression écrite, expression orale et examens blancs.
        </p>
      </div>

      <Tabs value={activeLevel} onValueChange={(value) => handleLevelChange(String(value))}>
        <TabsList className="w-full h-10!">
          {levels.map((l) => (
            <TabsTrigger key={l.level} value={l.level}>
              {l.level}
              {l.isLevelComplete && <CheckCircle2 className="text-emerald-500" />}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {level && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-zinc-500">
                Niveau {level.level} · {level.steps.filter(isStepDone).length}/{level.steps.length || "—"} étapes
              </p>
              {nextHref && (
                <Link
                  href={nextHref}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                  Reprendre <ArrowRight size={14} />
                </Link>
              )}
            </div>
            {level.steps.length > 0 && <LevelProgressBar steps={level.steps} />}
          </div>

          {level.steps.length === 0 ? (
            <p className="text-sm text-zinc-400 italic">Aucun parcours disponible pour ce niveau pour l&apos;instant.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
              <div className="md:border-r md:border-zinc-100 md:pr-4 space-y-3">
                <LevelMap level={level} selectedId={selectedId} currentId={currentId} onSelect={setSelectedId} />
                {!hasChecklist && (
                  <p className="text-xs text-zinc-400 italic px-3">
                    Expression Écrite, Expression Orale et Examen blanc arrivent bientôt pour ce niveau.
                  </p>
                )}
              </div>
              {selected && (
                <ParcoursDetail
                  parcours={selected}
                  level={level.level}
                  isCurrent={selected.id === currentId}
                  lessons={lessonsByParcours[selected.id]}
                  onRetry={() => retry(selected.id)}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
