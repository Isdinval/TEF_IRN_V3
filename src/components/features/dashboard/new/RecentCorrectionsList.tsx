"use client";

import { motion } from "framer-motion";
import { FileText, CheckCircle2, ChevronRight, Timer, History, PenTool, Mic, BookOpen, Headphones, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { InfoTooltip } from "./InfoTooltip";

interface Correction {
  id: string;
  created_at: string;
  score: number;
  study_time_minutes: number;
  exercise: {
    instructions: string;
    type: string; // 'examen_blanc' pour les sujets du catalogue writing_exam_scenarios
    category: string;
    // Distingue les 4 épreuves au sein du bloc "Examen blanc" (type seul ne
    // suffit plus). CE/CO ajoutés item 12 -- contrairement à EE/EO, aucune
    // page de détail n'existe pour elles (cf. carte non cliquable ci-dessous).
    skill?: 'EE' | 'EO' | 'CE' | 'CO';
  };
  ai_feedback?: {
    overall_score: number;
    global_comment: string;
    knowledge_references?: string[];
  };
}

interface RecentCorrectionsListProps {
  corrections: Correction[];
  title?: string;
  icon?: LucideIcon;
  tooltip?: string;
  emptyMessage?: string;
}

// Libellé du badge : cas particulier pour les examens blancs (writing_scenario_attempts),
// sinon on garde le type brut de l'exercice (EE, QCM, ...) comme avant.
function getTypeBadgeLabel(type?: string): string {
  if (type === "examen_blanc") return "Examen blanc";
  if (type === "entretien_oral") return "Oral";
  return type?.toUpperCase() || "EE";
}

const SKILL_ICONS: Record<string, LucideIcon> = {
  EO: Mic,
  EE: PenTool,
  CE: BookOpen,
  CO: Headphones,
};

export function RecentCorrectionsList({
  corrections,
  title = "Corrections récentes",
  icon: Icon = History,
  tooltip = "Vos 5 dernières corrections (exercices, examens blancs et sessions orales confondus), triées par date.",
  emptyMessage = "Aucune correction récente. Commencez un exercice d'expression !",
}: RecentCorrectionsListProps) {
  const router = useRouter();

  const header = (
    <div className="mb-6 flex items-center gap-2">
      <h2 className="flex items-center gap-2 text-xl font-black uppercase tracking-tight text-zinc-900">
        <Icon size={18} className="text-zinc-400" /> {title}
      </h2>
      <InfoTooltip text={tooltip} />
    </div>
  );

  if (corrections.length === 0) return (
    <div>
      {header}
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-[2.5rem] border-2 border-dashed border-zinc-100 bg-white">
        <FileText size={48} className="text-zinc-200 mb-4" />
        <p className="text-sm font-bold text-zinc-400">{emptyMessage}</p>
      </div>
    </div>
  );

  return (
    <div>
      {header}
      <div className="space-y-4">
      {corrections.map((item, i) => {
        const score = item.ai_feedback?.overall_score || item.score || 0;
        const notions = item.ai_feedback?.knowledge_references || [];
        // Option A validée avec Olivier (item 12) : CE/CO n'ont pas de page de
        // détail (contrairement à EE/EO) -- la carte affiche score et notions
        // (toujours cliquables individuellement) mais n'est pas cliquable
        // elle-même, pas de curseur ni de chevron laissant croire à une action.
        const hasDetailPage = item.exercise?.skill !== "CE" && item.exercise?.skill !== "CO";
        const SkillIcon = item.exercise?.skill ? (SKILL_ICONS[item.exercise.skill] || PenTool) : PenTool;

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`group ${hasDetailPage ? "cursor-pointer" : ""}`}
            onClick={hasDetailPage ? () => router.push(
              item.exercise?.skill === "EO"
                ? `/tef-irn/oral/history?id=${item.id}`
                : `/tef-irn/correction?id=${item.id}`
            ) : undefined}
          >
            <div className={`p-6 bg-white border border-zinc-100 rounded-[2rem] shadow-sm transition-all ${hasDetailPage ? "group-hover:border-indigo-200 group-hover:shadow-xl group-hover:shadow-indigo-100/30" : ""}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-indigo-50 text-indigo-600 border-none rounded-full px-3 py-1 text-[10px] uppercase font-black tracking-widest">
                    {getTypeBadgeLabel(item.exercise?.type)}
                  </Badge>
                  {item.exercise?.type === "examen_blanc" && item.exercise?.skill && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 border-zinc-200 text-zinc-500 rounded-full px-2 py-1 text-[10px] font-black"
                    >
                      <SkillIcon size={10} />
                      {item.exercise.skill}
                    </Badge>
                  )}
                  {item.study_time_minutes > 0 && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                      <Timer size={10} /> {item.study_time_minutes}m
                    </div>
                  )}
                  <span className="text-[10px] font-bold text-zinc-400">
                    {new Date(item.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                  </span>
                </div>
                {hasDetailPage && (
                  <ChevronRight size={20} className="shrink-0 text-zinc-300 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
                )}
              </div>

              <h3 className="font-black text-zinc-900 leading-snug mb-2">
                {item.exercise?.instructions || "Exercice"}
              </h3>

              {(notions.length > 0 || score < 80) && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {notions.map((notion, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-[8px] uppercase tracking-tighter border-zinc-200 text-zinc-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Le badge affiche "Grammaire (Comparatifs)" (item 10.12) -- category
                        // dans la parenthèse, sous_categorie hors parenthèse. Depuis l'item 8
                        // (practice/page.tsx sait filtrer sur tag, pas seulement topic), on
                        // transmet les deux au lieu de tronquer la parenthèse comme avant.
                        // Lowercase sur le tag : sous_categorie remonte INITCAP côté RPC
                        // (SQL), la taxonomie officielle (docs/lessons-tags-taxonomy.md) est
                        // entièrement en minuscules.
                        const match = notion.match(/^(.+?)(?:\s*\((.+)\))?$/);
                        const topic = match?.[1]?.trim() || notion;
                        const tag = match?.[2]?.trim().toLowerCase();
                        const params = new URLSearchParams({ topic });
                        if (tag) params.set('tag', tag);
                        router.push(`/tef-irn/practice?${params.toString()}`);
                      }}
                    >
                      {notion}
                    </Badge>
                  ))}
                  {notions.length === 0 && score < 80 && (
                     <Badge variant="outline" className="text-[8px] uppercase tracking-tighter border-zinc-100 text-zinc-400">
                       Notions à renforcer
                     </Badge>
                  )}
                </div>
              )}

              <p className="text-xs text-zinc-500 italic leading-relaxed mb-4">
                {item.ai_feedback?.global_comment || (score >= 80 ? "Excellent travail ! Continuez ainsi." : "Analyse terminée. Identifiez vos points faibles.") }
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-50">
                <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${score >= 50 ? "text-emerald-500" : "text-rose-500"}`}>
                  <CheckCircle2 size={12} />
                  {score >= 50 ? 'Validé' : 'À refaire'}
                </div>
                <div className={`text-xl font-black ${score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {score}<span className="text-xs text-zinc-400 ml-0.5">/100</span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
      </div>
    </div>
  );
}
