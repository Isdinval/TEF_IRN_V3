"use client";

import { useState } from "react";
import Link from "next/link";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { CompletionBadge, completionCardStyles } from "@/components/ui/CompletionVisuals";
import { InfoTooltip } from "@/components/features/dashboard/new/InfoTooltip";
import { CheckCircle2, Circle, PenTool, Mic, ClipboardCheck, Compass } from "lucide-react";
import type { LevelProgression, CecrlLevel } from "@/lib/progression";

interface ProgressionInteractiveProps {
  levels: LevelProgression[];
  currentLevel: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  grammaire: "Grammaire",
  conjugaison: "Conjugaison",
  syntaxe: "Syntaxe",
  vocabulaire: "Vocabulaire",
};

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

const EE_WHY = "L'Expression Écrite se travaille différemment des exercices ciblés : rédiger un texte complet et structuré, avec le lexique et la grammaire de ce niveau.";
const EO_WHY = "L'Expression Orale teste votre spontanéité face à un examinateur — impossible à s'entraîner via des QCM, il faut pratiquer la prise de parole.";
const EXAM_WHY = "Un examen blanc complet (CE, CO, EE, EO) dans les conditions réelles, pour vérifier que vous êtes prêt avant de passer l'épreuve officielle.";

function StatusIcon({ done }: { done: boolean }) {
  return done
    ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
    : <Circle size={18} className="text-zinc-300 shrink-0" />;
}

function StepRow({
  icon: Icon,
  title,
  subtitle,
  done,
  href,
  why,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  done: boolean;
  href: string;
  why: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-2xl border p-4 transition-colors ${
        done ? "border-emerald-100 bg-emerald-50/50" : "border-zinc-100 bg-white hover:bg-zinc-50"
      }`}
    >
      <StatusIcon done={done} />
      <Icon size={16} className="text-zinc-400 shrink-0" />
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

function LevelPanel({ level }: { level: LevelProgression }) {
  const hasChecklistSteps = level.ee !== null;

  return (
    <div className="space-y-3">
      {level.parcours.length === 0 && (
        <p className="text-sm text-zinc-400 italic px-1">Aucun parcours disponible pour ce niveau pour l'instant.</p>
      )}

      {level.parcours.map((p) => (
        <StepRow
          key={p.id}
          icon={Compass}
          title={`Parcours ${CATEGORY_LABEL[p.category.toLowerCase()] || p.category} ${level.level}`}
          subtitle={`${p.completed}/${p.total} leçons terminées`}
          done={p.isCompleted}
          href={`/tef-irn/parcours/${p.slug}`}
          why={CATEGORY_WHY[p.category.toLowerCase()] || DEFAULT_CATEGORY_WHY}
        />
      ))}

      {hasChecklistSteps ? (
        <>
          <StepRow
            icon={PenTool}
            title={`Expression Écrite ${level.level}`}
            subtitle={level.ee!.done ? "Fait" : level.parcoursCompleted ? "À faire" : "Recommandé après les parcours ci-dessus"}
            done={level.ee!.done}
            href={level.ee!.href}
            why={EE_WHY}
          />
          <StepRow
            icon={Mic}
            title={`Expression Orale ${level.level}`}
            subtitle={level.eo!.done ? "Fait" : level.parcoursCompleted ? "À faire" : "Recommandé après les parcours ci-dessus"}
            done={level.eo!.done}
            href={level.eo!.href}
            why={EO_WHY}
          />
          <StepRow
            icon={ClipboardCheck}
            title="Examen blanc"
            subtitle={level.examBlanc!.done ? "Fait" : level.parcoursCompleted ? "À faire" : "Recommandé après les parcours ci-dessus"}
            done={level.examBlanc!.done}
            href={level.examBlanc!.href}
            why={EXAM_WHY}
          />
        </>
      ) : (
        <p className="text-xs text-zinc-400 italic px-1 pt-2">
          Expression Écrite, Expression Orale et Examen blanc arrivent bientôt pour ce niveau.
        </p>
      )}
    </div>
  );
}

export default function ProgressionInteractive({ levels, currentLevel }: ProgressionInteractiveProps) {
  const [openLevels, setOpenLevels] = useState<string[]>(
    levels.some((l) => l.level === currentLevel) ? [currentLevel] : [levels[0]?.level].filter(Boolean) as string[]
  );

  return (
    <div className="max-w-3xl mx-auto p-6 py-12 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight">Ma progression</h1>
        <p className="text-sm text-zinc-500 font-medium">
          Le chemin complet vers le TEF IRN, niveau par niveau : parcours, expression écrite, expression orale et examens blancs.
        </p>
      </div>

      <Accordion className="space-y-4" value={openLevels} onValueChange={setOpenLevels}>
        {levels.map((level) => {
          const totalSteps = level.parcours.length + (level.ee ? 3 : 0);
          const doneSteps =
            level.parcours.filter((p) => p.isCompleted).length +
            (level.ee?.done ? 1 : 0) +
            (level.eo?.done ? 1 : 0) +
            (level.examBlanc?.done ? 1 : 0);

          return (
            <AccordionItem
              key={level.level}
              value={level.level}
              className={`rounded-[2rem] border px-6 border-b-0 shadow-sm transition-colors ${
                level.isLevelComplete ? completionCardStyles(true) : "bg-white border-zinc-100"
              }`}
            >
              <AccordionTrigger className="hover:no-underline py-5">
                <div className="flex items-center gap-3 flex-1 text-left">
                  <span className="text-lg font-black text-zinc-900">Niveau {level.level}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
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
