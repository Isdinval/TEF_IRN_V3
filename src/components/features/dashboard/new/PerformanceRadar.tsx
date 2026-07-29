"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from "recharts";
import { Radar as RadarIcon, Info } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

interface CompetencyData {
  subject: string;
  A: number;
  fullMark: number;
}

const SUBJECTS = ['CE', 'EE', 'EO'] as const;

export function PerformanceRadar({ data }: { data?: CompetencyData[] }) {
  // Recharts a besoin d'au moins 3 axes pour dessiner un polygone lisible.
  // Le RPC n'expose que les compétences déjà pratiquées (pas de faux "0%"),
  // donc on complète ici les axes manquants pour l'affichage uniquement.
  const chartData = SUBJECTS.map((subject) => {
    const practiced = data?.find((d) => d.subject === subject);
    return practiced || { subject, A: 0, fullMark: 100 };
  });
  const practicedCount = data?.length ?? 0;

  return (
    <Card className="overflow-hidden border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2.5rem]">
      <CardContent className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 flex items-center gap-2">
              <RadarIcon size={14} /> Analyse de Performance
            </h3>
            <p className="text-xl font-black text-zinc-900 tracking-tight">Radar de Compétences</p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                aria-label="Plus d'informations"
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400 transition-colors hover:text-zinc-600"
              >
                <Info size={18} />
              </TooltipTrigger>
              <TooltipContent side="left">
                Chaque axe (CE, EE, EO) est la moyenne de tous vos scores obtenus dans cette compétence, tous exercices et examens blancs confondus. CO n'est pas encore disponible.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="h-[320px] w-full relative">
          <div className="absolute inset-0 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid stroke="#f1f1f1" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#71717a', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em' }}
              />
              <Radar
                name="Niveau Actuel"
                dataKey="A"
                stroke="#4f46e5"
                strokeWidth={3}
                fill="#4f46e5"
                fillOpacity={0.15}
                isAnimationActive={true}
                animationDuration={1500}
              />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6">
           <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Votre score moyen</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-zinc-200" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Objectif B2</span>
           </div>
        </div>
        {practicedCount < SUBJECTS.length && (
          <p className="mt-4 text-center text-[10px] font-bold text-zinc-400 italic">
            {practicedCount === 0
              ? "Pratiquez des exercices pour faire apparaître votre radar."
              : "Certaines compétences n'ont pas encore été pratiquées (affichées à 0)."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
