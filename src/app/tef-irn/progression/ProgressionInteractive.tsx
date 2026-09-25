"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Circle, CircleDot, Lock, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LevelProgression, LevelStep, ParcoursStepStatus } from "@/lib/progression";
import { useCoachContext } from "@/contexts/CoachContext";
import { useParcours } from "@/contexts/ParcoursContext";
import { Badge } from "@/components/ui/badge";

interface ProgressionInteractiveProps {
  levels: LevelProgression[];
  currentLevel: string;
  /** Niveau demandé via ?niveau= (onglet à rouvrir au retour sur la page). */
  requestedLevel?: string;
}

interface LessonItem {
  id: string;
  title: string;
  url: string;
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

/**
 * Parcours "en cours" : le parcours actif de l'utilisateur (le même que la
 * barre "Parcours en cours" en haut de page) s'il appartient à ce niveau et
 * n'est pas terminé ; sinon le premier parcours non terminé du niveau.
 */
function currentParcoursId(level: LevelProgression | undefined, activeParcoursId: string | null): string | null {
  const parcours = parcoursOf(level);
  const active = parcours.find((p) => p.id === activeParcoursId && !p.isCompleted);
  return (active ?? parcours.find((p) => !p.isCompleted) ?? parcours[0])?.id ?? null;
}

/** Étape mise en avant (indigo) dans la barre de progression du niveau. */
function focusStepIndex(level: LevelProgression, currentId: string | null): number {
  const currentIndex = level.steps.findIndex((s) => s.kind === "parcours" && s.data.id === currentId && !s.data.isCompleted);
  return currentIndex !== -1 ? currentIndex : level.steps.findIndex((s) => !isStepDone(s));
}

function parcoursTitle(p: ParcoursStepStatus): string {
  return CATEGORY_LABEL[p.category.toLowerCase()] || p.category;
}

function LevelProgressBar({ steps, focusIndex }: { steps: LevelStep[]; focusIndex: number }) {
  return (
    <div className="flex gap-1" aria-hidden="true">
      {steps.map((step, i) => (
        <div
          key={i}
          className={cn(
            "h-2 flex-1 rounded-sm",
            isStepDone(step) ? "bg-emerald-500" : i === focusIndex ? "bg-indigo-600" : "bg-zinc-200"
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

/**
 * Les titres de leçons suivent le format "Titre | Accroche" : le titre
 * s'affiche en principal, l'accroche en second plan (plus de texte coupé).
 */
function splitTitle(title: string): { main: string; hook: string | null } {
  const [main, ...rest] = title.split(" | ");
  // "au TEF IRN" est répété dans tous les titres (SEO) : retiré à l'affichage
  // seulement, le titre en base ne change pas.
  return { main: main.replace(/\s+au TEF IRN$/i, ""), hook: rest.length > 0 ? rest.join(" | ") : null };
}

function LessonTitle({ title, href, muted }: { title: string; href?: string; muted?: boolean }) {
  const { main, hook } = splitTitle(title);
  return (
    <div className="flex-1 min-w-0">
      {href ? (
        <Link href={href} className="text-sm font-medium text-zinc-900 hover:text-indigo-600 hover:underline underline-offset-2">
          {main}
        </Link>
      ) : (
        <p className={cn("text-sm font-medium", muted ? "text-zinc-400" : "text-zinc-900")}>{main}</p>
      )}
      {hook && <p className={cn("text-xs", muted ? "text-zinc-300" : "text-zinc-400")}>{hook}</p>}
    </div>
  );
}

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-zinc-200/70">
      <span
        className={cn("block h-full rounded-full", pct === 100 ? "bg-emerald-500" : "bg-indigo-600")}
        style={{ width: `${pct}%` }}
      />
    </span>
  );
}

function LessonRow({ lesson, isNext }: { lesson: LessonItem; isNext: boolean }) {
  if (!lesson.unlocked) {
    return (
      <div className="flex items-start gap-3 px-3 py-2.5 border-b border-zinc-100 last:border-b-0">
        <Lock size={14} className="mt-0.5 text-zinc-300 shrink-0" />
        <LessonTitle title={lesson.title} muted />
      </div>
    );
  }
  const started = lesson.exercises.some((ex) => ex.isCompleted);
  const state: StepState = lesson.isCompleted ? "done" : started || isNext ? "current" : "todo";
  const nextExercise = isNext ? lesson.exercises.find((ex) => !ex.isCompleted) : undefined;
  return (
    <div
      className={cn(
        "flex flex-wrap items-start gap-x-3 gap-y-2 px-3 py-2.5 border-b border-zinc-100 last:border-b-0",
        isNext && "rounded-xl border-b-transparent bg-indigo-50/60"
      )}
    >
      <span className="mt-0.5"><StatusIcon state={state} size={14} /></span>
      <LessonTitle title={lesson.title} href={lesson.url} />
      <div className="flex items-center gap-3">
        {lesson.exercises.length > 0 ? (
          <ExerciseDots exercises={lesson.exercises} />
        ) : (
          <p className="text-xs text-zinc-400 italic">Aucun exercice</p>
        )}
        {nextExercise && (
          <Link
            href={nextExercise.url}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            {started ? "Continuer" : "Commencer"} <ArrowRight size={12} />
          </Link>
        )}
      </div>
    </div>
  );
}

function ParcoursDetail({
  parcours,
  level,
  isCurrent,
  isActive,
  lessons,
  onRetry,
}: {
  parcours: ParcoursStepStatus;
  level: string;
  isCurrent: boolean;
  /** Parcours actif de l'utilisateur (barre "Parcours en cours") : seul à porter "Vous êtes ici". */
  isActive: boolean;
  lessons: LessonsState | undefined;
  onRetry: () => void;
}) {
  const state: StepState = parcours.isCompleted ? "done" : isCurrent ? "current" : "todo";
  const nextLessonId = Array.isArray(lessons)
    ? lessons.find((l) => l.unlocked && !l.isCompleted)?.id
    : undefined;
  return (
    <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 md:p-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <StatusIcon state={state} size={18} />
          <h2 className="flex-1 text-lg font-bold text-zinc-900">
            Parcours {parcoursTitle(parcours)} {level}
          </h2>
          {isActive && !parcours.isCompleted && (
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">Vous êtes ici</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ProgressBar completed={parcours.completed} total={parcours.total} />
          <p className="shrink-0 text-sm text-zinc-500">
            {parcours.completed}/{parcours.total} leçons terminées
          </p>
        </div>
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
          <div className="-mx-3">
            {lessons.map((lesson) => (
              <LessonRow key={lesson.id} lesson={lesson} isNext={lesson.id === nextLessonId} />
            ))}
          </div>
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
              <span className="flex-1 min-w-0 flex flex-col gap-1.5">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate">{parcoursTitle(p)}</span>
                  <span className="text-xs font-normal text-zinc-400">{p.completed}/{p.total}</span>
                </span>
                <ProgressBar completed={p.completed} total={p.total} />
              </span>
            </button>
          );
        }

        const done = step.data.done;
        const label =
          step.kind === "ee"
            ? `Expression Écrite · ${step.data.section}`
            : step.kind === "eo"
              ? `Expression Orale · ${step.data.section}`
              : "Examen blanc";
        return (
          <Link
            key={`${step.kind}-${i}`}
            href={step.data.href}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-zinc-50"
          >
            <StatusIcon state={done ? "done" : "todo"} />
            <span className="flex-1 truncate">{label}</span>
            {done ? <span className="text-xs text-zinc-400">Fait</span> : <ChevronRight size={14} className="shrink-0 text-zinc-300" />}
          </Link>
        );
      })}
    </nav>
  );
}

export default function ProgressionInteractive({ levels, currentLevel, requestedLevel }: ProgressionInteractiveProps) {
  const initialLevel =
    [requestedLevel, currentLevel].find((lvl) => levels.some((l) => l.level === lvl)) ?? levels[0]?.level ?? "";
  const [activeLevel, setActiveLevel] = useState<string>(initialLevel);
  // null = suivre le parcours en cours (résolu une fois ParcoursContext chargé).
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lessonsByParcours, setLessonsByParcours] = useState<Record<string, LessonsState>>({});
  const requested = useRef(new Set<string>());
  const { setPageContext } = useCoachContext();
  const { activeParcours } = useParcours();

  const level = levels.find((l) => l.level === activeLevel);
  const currentId = currentParcoursId(level, activeParcours?.id ?? null);
  const effectiveSelectedId = selectedId ?? currentId;
  const selected = parcoursOf(level).find((p) => p.id === effectiveSelectedId);

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
    // replaceState plutôt que router.replace : pas de nouveau rendu serveur,
    // mais l'URL garde l'onglet (bouton retour depuis un exercice, lien partagé).
    // Les autres paramètres (ex. parcoursId ajouté par la Sidebar) sont conservés.
    const params = new URLSearchParams(window.location.search);
    params.set("niveau", value);
    window.history.replaceState(null, "", `?${params.toString()}`);
    setSelectedId(null);
  };

  const hasChecklist = level?.steps.some((s) => s.kind !== "parcours") ?? false;
  const focusIndex = level ? focusStepIndex(level, currentId) : -1;

  return (
    <div className="max-w-5xl mx-auto p-6 py-12 space-y-6">
      <div>
        <Badge className="mb-4 rounded-full border-none bg-indigo-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
          Parcours guidé
        </Badge>
        <h1 className="mb-4 text-4xl md:text-5xl font-black tracking-tighter text-zinc-900">
          MA <span className="text-indigo-600">PROGRESSION</span>
        </h1>
        <p className="max-w-2xl text-lg font-medium leading-relaxed text-zinc-500">
          Le chemin complet vers le TEF IRN, niveau par niveau : parcours, expression écrite, expression orale et examens blancs.
        </p>
      </div>

      <Tabs value={activeLevel} onValueChange={(value) => handleLevelChange(String(value))}>
        <TabsList className="w-full h-10!">
          {levels.map((l) => (
            <TabsTrigger key={l.level} value={l.level}>
              {l.level}
              {l.steps.length > 0 && (
                <span className="text-xs font-normal text-zinc-400">
                  {l.steps.filter(isStepDone).length}/{l.steps.length}
                </span>
              )}
              {l.isLevelComplete && <CheckCircle2 className="text-emerald-500" />}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {level && (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-zinc-500">
              Niveau {level.level} · {level.steps.filter(isStepDone).length}/{level.steps.length || "—"} étapes
            </p>
            {level.steps.length > 0 && <LevelProgressBar steps={level.steps} focusIndex={focusIndex} />}
          </div>

          {level.steps.length === 0 ? (
            <p className="text-sm text-zinc-400 italic">Aucun parcours disponible pour ce niveau pour l&apos;instant.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-[280px_minmax(0,1fr)]">
              <div className="md:border-r md:border-zinc-100 md:pr-4 space-y-3">
                <LevelMap level={level} selectedId={effectiveSelectedId} currentId={currentId} onSelect={setSelectedId} />
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
                  isActive={selected.id === activeParcours?.id}
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
