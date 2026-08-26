"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { completionCardStyles, CompletionBadge } from "@/components/ui/CompletionVisuals";
import { ChevronRight } from "lucide-react";
import { splitTitle } from "@/lib/lessons";

export type TreeExerciseStatus = "new" | "in_progress" | "completed";

export interface TreeExercise {
  id: string;
  instructions?: string;
  category?: string;
  lesson_id: string | null;
  point_cles_lesson?: string | null;
  // Intitulé pédagogique court, prioritaire sur point_cles_lesson pour
  // l'affichage (cf. skill llamakusi-point-cle-pedagogique).
  point_cle_pedagogique?: string | null;
  is_completed?: boolean;
  attempts_count?: number;
}

export interface LessonMeta {
  title: string;
  order_index: number;
}

// Même convention de statut que GrammarCheckTreeCatalogue / VocabCatalogueTable /
// CivicCatalogue, pour garder un langage cohérent entre les verticales LlamaKusi.
const STATUS_CONFIG: Record<TreeExerciseStatus, { label: string; className: string }> = {
  new: { label: "Non commencé", className: "bg-zinc-100 text-zinc-500" },
  in_progress: { label: "En cours", className: "bg-amber-50 text-amber-600" },
  completed: { label: "Terminé", className: "bg-emerald-50 text-emerald-600" },
};

// Pastille de couleur par thématique, affichée sur chaque ligne d'exercice — utile
// dès que le filtre "Toutes" mélange plusieurs catégories sous une même leçon
// (exercises.category diverge parfois de lessons.category, par design). Mêmes
// couleurs que GrammarCheckTreeCatalogue pour rester cohérent entre les 2 pages.
const CATEGORY_COLORS: Record<string, string> = {
  grammaire: "bg-emerald-50 text-emerald-700",
  conjugaison: "bg-blue-50 text-blue-700",
  syntaxe: "bg-violet-50 text-violet-700",
  orthographe: "bg-amber-50 text-amber-700",
  default: "bg-zinc-100 text-zinc-500",
};

function getCategoryColor(category?: string): string {
  return CATEGORY_COLORS[category?.toLowerCase() || ""] || CATEGORY_COLORS.default;
}

const NO_LESSON_KEY = "__sans_lecon__";
const DEFAULT_POINT_CLE_LABEL = "Général";

function getStatus(ex: TreeExercise): TreeExerciseStatus {
  if (ex.is_completed) return "completed";
  if ((ex.attempts_count || 0) > 0) return "in_progress";
  return "new";
}

interface PracticeTreeCatalogueProps {
  exercises: TreeExercise[];
  /** Métadonnées des leçons (title, order_index) indexées par lesson_id, pour trier et
   *  titrer les groupes de niveau 1 de l'arbre. */
  lessonMeta: Record<string, LessonMeta>;
  /** Préfixe de route pour le lien vers l'exercice, ex: "/tef-irn/practice". */
  basePath: string;
}

export default function PracticeTreeCatalogue({ exercises, lessonMeta, basePath }: PracticeTreeCatalogueProps) {
  // Niveau 1 : regroupement par leçon, trié par order_index (ordre pédagogique du
  // parcours). Les exercices sans lesson_id (aucun cas connu en base pour
  // qcm/qcm_centre_entrainement/association, mais gardé par robustesse) sont
  // regroupés dans "Autres exercices", en fin de liste.
  const lessonGroups = useMemo(() => {
    const map = new Map<string, TreeExercise[]>();
    exercises.forEach((ex) => {
      const key = ex.lesson_id || NO_LESSON_KEY;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ex);
    });

    return Array.from(map.entries())
      .map(([lessonId, items]) => {
        const meta = lessonId !== NO_LESSON_KEY ? lessonMeta[lessonId] : undefined;
        const completedCount = items.filter((i) => i.is_completed).length;
        return {
          lessonId,
          title: lessonId === NO_LESSON_KEY ? "Autres exercices" : (meta?.title || "Leçon"),
          orderIndex: lessonId === NO_LESSON_KEY ? Infinity : (meta?.order_index ?? Infinity),
          items,
          completedCount,
          isFullyDone: items.length > 0 && completedCount === items.length,
        };
      })
      .sort((a, b) => a.orderIndex - b.orderIndex || a.title.localeCompare(b.title));
  }, [exercises, lessonMeta]);

  // Scroll automatique vers le haut de la leçon qu'on vient d'ouvrir — sans ça,
  // le contenu déplié reste hors champ en bas d'écran sur les longues listes.
  // scroll-mt-24 compense ParcoursTopBar (sticky top-0, ~64px) quand elle est
  // affichée, pour ne pas caler le titre de la leçon juste sous la barre.
  // Délai de 220ms (> 200ms, durée de l'animation CSS accordion-down/up dans
  // globals.css) : si une autre leçon était ouverte, elle continue de se
  // replier pendant l'ouverture de la nouvelle, décalant la cible tant que
  // l'animation n'est pas terminée — scroller trop tôt (ex: au frame suivant)
  // vise une position qui n'est plus la bonne une fois l'animation finie.
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleValueChange = (value: string[]) => {
    const openedId = value[0];
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    if (!openedId) return;
    scrollTimeoutRef.current = setTimeout(() => {
      document.getElementById(`lesson-${openedId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 220);
  };

  return (
    <Accordion className="space-y-3" onValueChange={handleValueChange}>
      {lessonGroups.map((group) => {
        const { main, subtitle } = splitTitle(group.title);

        // Niveau 2 : sous-groupement par point clé de la leçon, en en-tête de section
        // fixe (pas de sous-accordéon) — toujours visible une fois la leçon dépliée.
        const pointCleMap = new Map<string, TreeExercise[]>();
        group.items.forEach((ex) => {
          const label = ex.point_cle_pedagogique?.trim() || ex.point_cles_lesson?.trim() || DEFAULT_POINT_CLE_LABEL;
          if (!pointCleMap.has(label)) pointCleMap.set(label, []);
          pointCleMap.get(label)!.push(ex);
        });
        const pointCleGroups = Array.from(pointCleMap.entries());

        return (
          <AccordionItem
            key={group.lessonId}
            value={group.lessonId}
            id={`lesson-${group.lessonId}`}
            className={`scroll-mt-24 rounded-[2rem] border shadow-sm px-6 border-b-0 transition-colors ${
              group.isFullyDone ? completionCardStyles(true) : "bg-white border-zinc-100"
            }`}
          >
            <AccordionTrigger className="hover:no-underline py-5">
              <div className="flex flex-col gap-1 text-left flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black uppercase tracking-tight text-zinc-900">{main}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 shrink-0">
                    {group.completedCount}/{group.items.length} terminé{group.items.length > 1 ? "s" : ""}
                  </span>
                  {group.isFullyDone && <CompletionBadge />}
                </div>
                {/* Sous-titre pédagogique de la leçon, calculé par splitTitle
                    mais jusqu'ici jamais affiché (même fix que
                    GrammarCheckTreeCatalogue.tsx). Item 8 du plan
                    "point-clés pédagogiques". */}
                {subtitle && (
                  <p className="text-xs font-medium normal-case tracking-normal text-zinc-400 line-clamp-1">
                    {subtitle}
                  </p>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-6 space-y-5">
              {pointCleGroups.map(([label, items]) => (
                <div key={label}>
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 px-1">
                    {label}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {items.map((ex) => {
                      const st = getStatus(ex);
                      return (
                        <Link
                          key={ex.id}
                          href={`${basePath}/${ex.id}`}
                          className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 transition-colors group rounded-2xl border border-zinc-50"
                        >
                          {ex.category && (
                            <Badge
                              className={`shrink-0 border-none rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${getCategoryColor(ex.category)}`}
                            >
                              {ex.category}
                            </Badge>
                          )}
                          <p className="flex-1 min-w-0 text-sm font-bold text-zinc-800 line-clamp-2 group-hover:text-purple-600 transition-colors">
                            {ex.instructions || "Exercice"}
                          </p>
                          {st === "completed" ? (
                            <CompletionBadge />
                          ) : (
                            <Badge
                              className={`shrink-0 border-none rounded-full px-3 py-1 text-[9px] font-black uppercase ${STATUS_CONFIG[st].className}`}
                            >
                              {STATUS_CONFIG[st].label}
                            </Badge>
                          )}
                          <ChevronRight size={16} className="shrink-0 text-zinc-300 group-hover:text-purple-600 transition-colors" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
