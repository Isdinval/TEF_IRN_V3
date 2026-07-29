"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Target, ChevronRight, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface CompetencyScore {
  subject: string; // 'CE' | 'EE' | 'EO'
  A: number; // score moyen 0-100
}

interface ScoreProjectionProps {
  currentLevel: string;
  goalLevel: string;
  skills: CompetencyScore[];
}

const SKILL_LABELS: Record<string, string> = {
  CE: "Compréhension Écrite",
  EE: "Expression Écrite",
  EO: "Expression Orale",
  CO: "Compréhension Orale",
};

const SKILL_ORDER = ["CO", "CE", "EO", "EE"];

// Convertit un score moyen (0-100%) en estimation de points TEF IRN (200-499)
function toEstimatedPoints(percentScore: number): number {
  const clamped = Math.min(Math.max(percentScore, 0), 100);
  return Math.round(200 + (clamped / 100) * 299);
}

function levelFromScore(estimatedScore: number): string {
  if (estimatedScore >= 400) return "B2";
  if (estimatedScore >= 300) return "B1";
  return "A2";
}

export function ScoreProjection({ currentLevel, goalLevel, skills }: ScoreProjectionProps) {
  const router = useRouter();

  const bySubject: Record<string, number> = {};
  skills.forEach((s) => { bySubject[s.subject] = s.A; });

  const availableScores = SKILL_ORDER
    .filter((subj) => subj !== "CO" && bySubject[subj] !== undefined)
    .map((subj) => toEstimatedPoints(bySubject[subj]));

  const globalEstimate = availableScores.length > 0
    ? Math.round(availableScores.reduce((a, b) => a + b, 0) / availableScores.length)
    : null;

  const progressPercent = globalEstimate !== null
    ? Math.min(Math.max(((globalEstimate - 200) / 299) * 100, 5), 100)
    : 0;

  return (
    <Card className="overflow-hidden border-none bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-2xl shadow-indigo-200/50 rounded-[2.5rem] relative">
      <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <CardContent className="p-8">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-100 mb-6">
          <TrendingUp size={14} /> Projection de Score TEF
        </div>

        <div className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-black">
                {globalEstimate !== null ? globalEstimate : "-"}
                <span className="text-lg opacity-60 ml-1">pts</span>
              </p>
              <p className="text-sm font-bold text-indigo-100 italic">
                {globalEstimate !== null ? "Estimation actuelle" : "Pratiquez pour voir votre estimation"}
              </p>
            </div>
            {globalEstimate !== null && (
              <div className="text-right">
                <div className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                  Niveau {levelFromScore(globalEstimate)}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-100">
              <span>Niveau actuel: {currentLevel}</span>
              <span>Objectif: {goalLevel}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
               <motion.div
                 initial={{ width: 0 }}
                 animate={{ width: `${progressPercent}%` }}
                 className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
               />
            </div>
          </div>

          {/* Détail par compétence officielle TEF IRN */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            {SKILL_ORDER.map((subj) => {
              const score = bySubject[subj];
              const hasData = subj !== "CO" && score !== undefined;
              const points = hasData ? toEstimatedPoints(score) : null;

              return (
                <div key={subj} className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-100">{SKILL_LABELS[subj]}</span>
                  {subj === "CO" ? (
                    <span className="flex items-center gap-1 text-indigo-200/70 font-bold">
                      <Lock size={12} /> Bientôt disponible
                    </span>
                  ) : hasData ? (
                    <span className="font-black">{points} pts</span>
                  ) : (
                    <span className="text-indigo-200/70 font-bold italic">Pas encore de données</span>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => router.push('/tef-irn/exam')}
            className="flex w-full items-center justify-between rounded-2xl bg-white/10 p-4 transition-all hover:bg-white/20 group"
          >
             <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                   <Target size={16} />
                </div>
                <span className="text-xs font-black uppercase tracking-wider">Passer un examen blanc</span>
             </div>
             <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
