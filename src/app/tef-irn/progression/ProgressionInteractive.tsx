"use client";

import { useState } from "react";
import Link from "next/link";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { CompletionBadge } from "@/components/ui/CompletionVisuals";
import { InfoTooltip } from "@/components/features/dashboard/new/InfoTooltip";
import { CheckCircle2, Circle, Lock, PenTool, Mic, ClipboardCheck, Compass, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LevelProgression, LevelStep, ParcoursStepStatus, ChecklistStepStatus, CheckpointStatus } from "@/lib/progression";

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

const CATEGORY_LABEL: Record<string, string> = {
  grammaire: "Grammaire",
  conjugaison: "Conjugaison",
  syntaxe: "Syntaxe",
  vocabulaire: "Vocabulaire",
};

// Une couleur par catégorie -- retour Olivier après tests manuels : "pas
// assez de couleur" sur la page progression.
const CATEGORY_COLOR: Record<string, string> = {
  grammaire: "bg-blue-500",
  conjugaison: "bg-purple-500",
  syntaxe: "bg-orange-500",
  vocabulaire: "bg-emerald-500",
};
const DEFAULT_CATEGORY_COLOR = "bg-zinc-400";

// Justification pédagogique affichée au clic sur l'icône (i) de chaque étape
// -- copie statique, pas de dépendance à un champ base de données (aucune
// colonne "justification" n'existe pour les catégories/EE/EO/Examen).
const CATEGORY_WHY: Record<string, string> = {
  grammaire: "Les règles qui structurent vos phrases (accords, temps, structures) — la base évaluée dans toutes les épreuves du TEF IRN.",
  conjugaison: "Maîtriser les verbes à chaque temps est indispensable à l'oral comme à l'écrit — une erreur de conjugaison se voit immédiatement.",
  syntaxe: "L'ordre des mots et la construction de phrases complexes : souvent ce qui distingue un niveau B1 d'un niveau B2.",
  vocabulaire: "Le lexique thématique attendu à ce niveau — sans vocabulaire, même une grammaire parfaite ne suffit pas à répondre aux questions.",
};
const DEFAULT_CATEGORY_WHY = "Une compétence évaluée au TEF IRN, à consolider avant de passer au niveau suivant.";

const EE_WHY = "L'Expression Écrite se travaille différemment des exercices ciblés : rédiger un texte complet et structuré, avec le lexique et la grammaire de ce niveau. Intercalée entre les parcours pour ne pas s'entraîner uniquement en fin de niveau.";
const EO_WHY = "L'Expression Orale teste votre spontanéité face à un examinateur — impossible à s'entraîner via des QCM, il faut pratiquer la prise de parole régulièrement.";
const EXAM_WHY = "Un examen blanc complet (CE, CO, EE, EO) dans les conditions réelles, pour vérifier que vous êtes prêt avant de passer l'épreuve officielle.";

const EXERCISE_TYPE_LABEL: Record<string, string> = {
  qcm: "Exercice QCM",
  trous: "Exercice Chasse à l'erreur",
};

function StatusIcon({ done }: { done: boolean }) {
  return done
    ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
    : <Circle size={18} className="text-zinc-300 shrink-0" />;
}

function StepRow({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  done,
  href,
  why,
}: {
  icon: React.ElementType;
  iconColor?: string;
  title: string;
  subtitle: string;
  done: boolean;
  href: string;
  why: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-4 transition-colors",
        done ? "border-emerald-200 bg-emerald-50" : "border-zinc-100 bg-white hover:bg-zinc-50"
      )}
    >
      <StatusIcon done={done} />
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", iconColor || "bg-zinc-400")}>
        <Icon size={14} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-black text-zinc-900 truncate">{title}</p>
          <span onClick={(e) => e.preventDefault()}>
            <InfoTooltip text={why} />
          </span>
        </div>
        <p className="text-xs font-medium text-zinc-400">{subtitle}</p>
      </div>
    </Link>
  );
}

/**
 * Numérote les exercices d'une leçon dans l'ordre reçu (QCM puis Chasse aux
 * erreurs -- déjà trié ainsi par getLessonQuotaExercises côté serveur) --
 * retour Olivier après tests manuels : remplace l'ancien affichage
 * notion/catégorie/thématique par un simple "Exercice QCM 1/2/3, Exercice
 * Chasse à l'erreur 1/2/3", tout le superflu retiré.
 */
function ExerciseChips({ exercises }: { exercises: LessonItem["exercises"] }) {
  const seenPerType: Record<string, number> = {};
  return (
    <div className="flex flex-wrap gap-2">
      {exercises.map((ex) => {
        seenPerType[ex.type] = (seenPerType[ex.type] || 0) + 1;
        const label = `${EXERCISE_TYPE_LABEL[ex.type] || "Exercice"} ${seenPerType[ex.type]}`;
        return (
          <Link
            key={ex.id}
            href={ex.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors",
              ex.isCompleted
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
            )}
          >
            {ex.isCompleted ? <CheckCircle2 size={13} /> : <Circle size={13} className="text-zinc-300" />}
            {label}
          </Link>
        );
      })}
    </div>
  );
}

function LessonRow({ lesson }: { lesson: LessonItem }) {
  if (!lesson.unlocked) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50/60 px-4 py-3">
        <Lock size={15} className="text-zinc-300 shrink-0" />
        <p className="text-sm font-bold text-zinc-400 truncate">{lesson.title}</p>
      </div>
    );
  }
  return (
    <div className={cn("rounded-xl border px-4 py-3 space-y-2", lesson.isCompleted ? "border-emerald-100 bg-emerald-50/40" : "border-zinc-100 bg-white")}>
      <div className="flex items-center gap-2">
        <StatusIcon done={lesson.isCompleted} />
        <p className="text-sm font-bold text-zinc-900 truncate">{lesson.title}</p>
      </div>
      {lesson.exercises.length > 0 ? (
        <ExerciseChips exercises={lesson.exercises} />
      ) : (
        <p className="text-xs text-zinc-400 italic">Aucun exercice qcm/trous sur cette leçon.</p>
      )}
    </div>
  );
}

function ParcoursTreeStep({ p, level, why }: { p: ParcoursStepStatus; level: string; why: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lessons, setLessons] = useState<LessonItem[] | null>(null);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/progression/parcours-catalogue?parcoursId=${p.id}`);
      if (!res.ok) throw new Error("fetch failed");
      const json = await res.json();
      setLessons(json.lessons);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next && !lessons && !loading) load();
  };

  const categoryKey = p.category.toLowerCase();

  return (
    <div className={cn("rounded-2xl border transition-colors", p.isCompleted ? "border-emerald-200 bg-emerald-50" : "border-zinc-100 bg-white")}>
      <button onClick={handleToggle} className="w-full flex items-center gap-3 p-4 text-left">
        <StatusIcon done={p.isCompleted} />
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", CATEGORY_COLOR[categoryKey] || DEFAULT_CATEGORY_COLOR)}>
          <Compass size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-black text-zinc-900 truncate">
              Parcours {CATEGORY_LABEL[categoryKey] || p.category} {level}
            </p>
            <span onClick={(e) => e.stopPropagation()}>
              <InfoTooltip text={why} />
            </span>
          </div>
          <p className="text-xs font-medium text-zinc-400">{p.completed}/{p.total} leçons terminées</p>
        </div>
        <ChevronDown size={16} className={cn("shrink-0 text-zinc-300 transition-transform", isOpen && "rotate-180")} />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-2">
          {loading && (
            <div className="flex justify-center py-6 text-zinc-300">
              <Loader2 className="animate-spin" size={20} />
            </div>
          )}
          {!loading && error && (
            <p className="text-xs font-bold text-red-500 px-1">
              Impossible de charger le détail.{" "}
              <button onClick={load} className="underline underline-offset-2">Réessayer</button>
            </p>
          )}
          {!loading && !error && lessons && (
            lessons.length > 0 ? (
              lessons.map((lesson) => <LessonRow key={lesson.id} lesson={lesson} />)
            ) : (
              <p className="text-xs text-zinc-400 italic px-1">Aucune leçon dans ce parcours pour l'instant.</p>
            )
          )}
        </div>
      )}
    </div>
  );
}

function ChecklistRow({ kind, step, level }: { kind: "ee" | "eo"; step: ChecklistStepStatus; level: string }) {
  const isEE = kind === "ee";
  const label = isEE ? "Expression Écrite" : "Expression Orale";
  const unit = isEE ? "rédaction" : "session orale";
  return (
    <StepRow
      icon={isEE ? PenTool : Mic}
      iconColor={isEE ? "bg-pink-500" : "bg-cyan-500"}
      title={`${label} ${level} — Section ${step.section}`}
      subtitle={step.done ? `Fait (${unit} ${step.section} ${step.index}/${step.total})` : step.unlocked ? `À faire — ${unit} ${step.section} ${step.index}/${step.total} du niveau` : `Recommandé après le parcours ci-dessus (${unit} ${step.section} ${step.index}/${step.total})`}
      done={step.done}
      href={step.href}
      why={isEE ? EE_WHY : EO_WHY}
    />
  );
}

function ExamRow({ step }: { step: CheckpointStatus & { unlocked: boolean } }) {
  return (
    <StepRow
      icon={ClipboardCheck}
      iconColor="bg-red-500"
      title="Examen blanc"
      subtitle={step.done ? "Fait" : step.unlocked ? "À faire" : "Recommandé une fois tous les parcours du niveau terminés"}
      done={step.done}
      href={step.href}
      why={EXAM_WHY}
    />
  );
}

function LevelPanel({ level }: { level: LevelProgression }) {
  const hasChecklist = level.steps.some((s) => s.kind !== "parcours");

  return (
    <div className="space-y-3">
      {level.steps.length === 0 && (
        <p className="text-sm text-zinc-400 italic px-1">Aucun parcours disponible pour ce niveau pour l'instant.</p>
      )}

      {level.steps.map((step: LevelStep, i: number) => {
        switch (step.kind) {
          case "parcours":
            return (
              <ParcoursTreeStep
                key={step.data.id}
                p={step.data}
                level={level.level}
                why={CATEGORY_WHY[step.data.category.toLowerCase()] || DEFAULT_CATEGORY_WHY}
              />
            );
          case "ee":
            return <ChecklistRow key={`ee-${i}`} kind="ee" step={step.data} level={level.level} />;
          case "eo":
            return <ChecklistRow key={`eo-${i}`} kind="eo" step={step.data} level={level.level} />;
          case "exam":
            return <ExamRow key={`exam-${i}`} step={step.data} />;
          default:
            return null;
        }
      })}

      {!hasChecklist && level.steps.length > 0 && (
        <p className="text-xs text-zinc-400 italic px-1 pt-2">
          Expression Écrite, Expression Orale et Examen blanc arrivent bientôt pour ce niveau.
        </p>
      )}
    </div>
  );
}

// Un dégradé par niveau -- retour Olivier après tests manuels : la page
// manquait de couleur et ne prenait pas assez de place. Chaque niveau garde
// son identité visuelle même une fois replié.
const LEVEL_GRADIENT: Record<string, string> = {
  A1: "from-sky-50 to-white border-sky-100",
  A2: "from-emerald-50 to-white border-emerald-100",
  B1: "from-amber-50 to-white border-amber-100",
  B2: "from-violet-50 to-white border-violet-100",
};

export default function ProgressionInteractive({ levels, currentLevel }: ProgressionInteractiveProps) {
  const [openLevels, setOpenLevels] = useState<string[]>(
    levels.some((l) => l.level === currentLevel) ? [currentLevel] : [levels[0]?.level].filter(Boolean) as string[]
  );

  return (
    <div className="max-w-5xl mx-auto p-6 py-12 space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight">
          Ma progression
        </h1>
        <p className="text-sm text-zinc-500 font-medium">
          Le chemin complet vers le TEF IRN, niveau par niveau : parcours, expression écrite, expression orale et examens blancs.
        </p>
      </div>

      <Accordion className="space-y-4" value={openLevels} onValueChange={setOpenLevels}>
        {levels.map((level) => {
          const totalSteps = level.steps.length;
          const doneSteps = level.steps.filter((s) => (s.kind === "parcours" ? s.data.isCompleted : s.data.done)).length;

          return (
            <AccordionItem
              key={level.level}
              value={level.level}
              className={cn(
                "rounded-[2rem] border px-6 border-b-0 shadow-sm transition-colors bg-gradient-to-br",
                LEVEL_GRADIENT[level.level] || "from-zinc-50 to-white border-zinc-100"
              )}
            >
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-3 flex-1 text-left">
                  <span className="text-xl font-black text-zinc-900">Niveau {level.level}</span>
                  <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                    {doneSteps}/{totalSteps || "—"} étapes
                  </span>
                  {level.isLevelComplete && <CompletionBadge />}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <LevelPanel level={level} />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
