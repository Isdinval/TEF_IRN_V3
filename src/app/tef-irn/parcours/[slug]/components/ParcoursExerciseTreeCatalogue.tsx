"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { completionCardStyles, CompletionBadge } from "@/components/ui/CompletionVisuals";
import { ChevronRight, HelpCircle, Type } from "lucide-react";
import { splitTitle } from "@/lib/lessons";
import { Exercise } from "@/lib/parcours";

// Adapté de GrammarCheckTreeCatalogue.tsx / PracticeTreeCatalogue.tsx (item #6
// du plan "Verrouillage exercices topbar/parcours") -- même structure arbre
// (leçon > point clé), duplication assumée comme les 2 catalogues existants
// (item #8 du plan : factorisation explicitement déclinée).
//
// Typé sur Exercise (lib/parcours.ts) plutôt que sur le TreeExercise de
// GrammarCheckTreeCatalogue.tsx : category y est optionnel (les 2 catalogues
// existants ne l'utilisent que pour l'affichage), alors que getExerciseUrl()
// (lib/parcours.ts, utilisé ici comme getUrl) l'exige non-optionnel --
// catalogueExercises vient toujours d'objets Exercise complets en pratique
// (getUnlockedExercisesCatalogue), le typage local le reflète fidèlement.
//
// Seule différence structurelle réelle avec les 2 catalogues existants :
// basePath (un seul préfixe de route, cohérent car mono-type sur ces 2 pages)
// devient getUrl (résolution par exercice), car /parcours/[slug] mélange
// qcm (-> /practice) et trous (-> /grammar-check) sous une même leçon.

export type CatalogueExercise = Exercise & { is_completed?: boolean };

type Status = "new" | "in_progress" | "completed";

export interface LessonMeta {
  title: string;
  order_index: number;
}

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  new: { label: "Non commencé", className: "bg-zinc-100 text-zinc-500" },
  in_progress: { label: "En cours", className: "bg-amber-50 text-amber-600" },
  completed: { label: "Terminé", className: "bg-emerald-50 text-emerald-600" },
};

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

// Catalogue mixte (qcm + trous) contrairement aux 2 catalogues mono-type
// existants -- badge de format nécessaire ici pour que l'utilisateur sache
// vers quelle page (QCM ou Chasse aux erreurs) le clic va l'envoyer, avant
// même de cliquer. Même vocabulaire que les boutons de la TopBar (item #4).
const TYPE_CONFIG: Record<string, { label: string; icon: typeof HelpCircle; className: string }> = {
  qcm: { label: "QCM", icon: HelpCircle, className: "bg-indigo-50 text-indigo-600" },
  trous: { label: "Chasse aux erreurs", icon: Type, className: "bg-fuchsia-50 text-fuchsia-600" },
};

const NO_LESSON_KEY = "__sans_lecon__";
const DEFAULT_POINT_CLE_LABEL = "Général";

function getStatus(ex: CatalogueExercise): Status {
  if (ex.is_completed) return "completed";
  if ((ex.attempts_count || 0) > 0) return "in_progress";
  return "new";
}

interface ParcoursExerciseTreeCatalogueProps {
  exercises: CatalogueExercise[];
  /** Métadonnées des leçons (title, order_index) indexées par lesson_id, pour trier et
   *  titrer les groupes de niveau 1 de l'arbre. */
  lessonMeta: Record<string, LessonMeta>;
  /** Résolution d'URL PAR exercice (contrairement à basePath dans les 2 catalogues
   *  mono-type existants) -- typiquement getExerciseUrl() de lib/parcours.ts. */
  getUrl: (exercise: CatalogueExercise) => string;
}

export default function ParcoursExerciseTreeCatalogue({ exercises, lessonMeta, getUrl }: ParcoursExerciseTreeCatalogueProps) {
  // Niveau 1 : regroupement par leçon, trié par order_index (ordre pédagogique du
  // parcours). Les exercices sans lesson_id (aucun cas connu en production) sont
  // regroupés dans "Autres exercices", en fin de liste.
  const lessonGroups = useMemo(() => {
    const map = new Map<string, CatalogueExercise[]>();
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

  // Scroll automatique vers le haut de la leçon qu'on vient d'ouvrir -- même
  // mécanique que GrammarCheckTreeCatalogue.tsx (délai calé sur l'animation
  // accordion-down/up de globals.css). scroll-mt-24 compense ParcoursTopBar
  // (sticky top-0, ~64px), toujours visible sur /parcours/[slug].
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleValueChange = (value: string[]) => {
    const openedId = value[0];
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    if (!openedId) return;
    scrollTimeoutRef.current = setTimeout(() => {
      document.getElementById(`parcours-lesson-${openedId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 220);
  };

  return (
    <Accordion className="space-y-3" onValueChange={handleValueChange}>
      {lessonGroups.map((group) => {
        const { main, subtitle } = splitTitle(group.title);

        // Niveau 2 : sous-groupement par point clé de la leçon, en en-tête de section
        // fixe (pas de sous-accordéon) -- toujours visible une fois la leçon dépliée.
        const pointCleMap = new Map<string, CatalogueExercise[]>();
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
            id={`parcours-lesson-${group.lessonId}`}
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
                      const typeConfig = TYPE_CONFIG[ex.type];
                      const TypeIcon = typeConfig?.icon;
                      return (
                        <Link
                          key={ex.id}
                          href={getUrl(ex)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 transition-colors group rounded-2xl border border-zinc-50"
                        >
                          {typeConfig && TypeIcon && (
                            <Badge
                              className={`shrink-0 border-none rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase gap-1 ${typeConfig.className}`}
                            >
                              <TypeIcon size={10} /> {typeConfig.label}
                            </Badge>
                          )}
                          {ex.category && (
                            <Badge
                              className={`shrink-0 border-none rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${getCategoryColor(ex.category)}`}
                            >
                              {ex.category}
                            </Badge>
                          )}
                          <p className="flex-1 min-w-0 text-sm font-bold text-zinc-800 line-clamp-2 group-hover:text-indigo-600 transition-colors">
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
                          <ChevronRight size={16} className="shrink-0 text-zinc-300 group-hover:text-indigo-600 transition-colors" />
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
