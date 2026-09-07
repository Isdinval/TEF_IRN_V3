"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "./InfoTooltip";
import { CheckCircle2, Circle, BookOpen, ListChecks, PenTool, Mic, ClipboardCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface TodayChecklist {
  lesson: boolean;
  qcm: boolean;
  trous: boolean;
  ee: boolean;
  eo: boolean;
  examen_blanc: boolean;
}

interface TodayChecklistCardProps {
  checklist: TodayChecklist | null | undefined;
}

interface ChecklistItemConfig {
  key: keyof TodayChecklist;
  label: string;
  icon: LucideIcon;
  href: string;
}

// 6 items validés avec Olivier -- alimentés par la RPC get_today_checklist
// (migration 20260907000001_today_checklist_rpc.sql), un booléen "fait
// aujourd'hui" par item, pas de quota chiffré (le quota 3 QCM + 3 Trous
// existant est par leçon, pas par jour).
const ITEMS: ChecklistItemConfig[] = [
  { key: "lesson", label: "Leçon", icon: BookOpen, href: "/tef-irn/parcours" },
  { key: "qcm", label: "QCM", icon: ListChecks, href: "/tef-irn/practice" },
  { key: "trous", label: "Trous", icon: ListChecks, href: "/tef-irn/grammar-check" },
  { key: "ee", label: "Expression écrite", icon: PenTool, href: "/tef-irn/writing" },
  { key: "eo", label: "Expression orale", icon: Mic, href: "/tef-irn/oral" },
  { key: "examen_blanc", label: "Examen blanc", icon: ClipboardCheck, href: "/tef-irn/exam" },
];

export function TodayChecklistCard({ checklist }: TodayChecklistCardProps) {
  const router = useRouter();

  if (!checklist) return null;

  const doneCount = ITEMS.filter((item) => checklist[item.key]).length;

  return (
    <Card className="overflow-hidden border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2.5rem]">
      <CardContent className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black uppercase tracking-tight text-zinc-700 flex items-center gap-2">
            <Badge className="bg-emerald-600 text-white rounded-full">Objectif du jour</Badge>
            <InfoTooltip text="Ce que vous avez déjà pratiqué aujourd'hui, tous types d'exercices confondus. Cliquez sur un élément non coché pour vous y mettre." />
          </h3>
          <span className="text-xs font-black text-zinc-400">{doneCount}/{ITEMS.length}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {ITEMS.map((item) => {
            const done = checklist[item.key];
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => router.push(item.href)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition-all hover:-translate-y-0.5",
                  done ? "bg-emerald-50" : "bg-zinc-50 hover:bg-zinc-100"
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  done ? "bg-emerald-500 text-white" : "bg-white text-zinc-400 border border-zinc-200"
                )}>
                  <Icon size={18} />
                </div>
                <span className={cn("text-[10px] font-black uppercase tracking-wide", done ? "text-emerald-600" : "text-zinc-400")}>
                  {item.label}
                </span>
                {done ? (
                  <CheckCircle2 size={14} className="text-emerald-500" />
                ) : (
                  <Circle size={14} className="text-zinc-300" />
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
