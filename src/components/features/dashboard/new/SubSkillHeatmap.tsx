"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import { InfoTooltip } from "./InfoTooltip";

interface SubSkillData {
  label: string;
  score: number;
  count: number;
  group_name?: "ÉCRIT" | "ORAL";
}

// Petit graphique réutilisé pour chaque section (Écrit / Oral) -- évite de dupliquer le
// BarChart + Tooltip + Cell deux fois pour un composant déjà simple.
function SubSkillBarChart({ data }: { data: SubSkillData[] }) {
  return (
    <div style={{ height: Math.max(data.length * 44, 120) }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30 }}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            dataKey="label"
            type="category"
            tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
            width={100}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-xl bg-zinc-900 p-3 text-[10px] font-black text-white shadow-xl">
                    {payload[0].value}% de réussite
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="score" radius={[0, 10, 10, 0]} barSize={20}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.score >= 70 ? '#10b981' : entry.score >= 40 ? '#6366f1' : '#f43f5e'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SubSkillHeatmap({ data }: { data: SubSkillData[] }) {
  const router = useRouter();

  // Contrairement au PerformanceRadar (axes fixes CE/EE/EO complétés à 0), la
  // heatmap n'a pas d'axe fixe -- data=[] ne peut pas être "complété" pour
  // affichage, il faut un état vide dédié pour ne pas laisser un trou dans la
  // grille 2 colonnes de l'onglet "Analyse détaillée" (page.tsx).
  if (!data || data.length === 0) {
    return (
      <Card className="overflow-hidden border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2.5rem]">
        <CardContent className="p-8">
          <div className="mb-8 space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500 flex items-center gap-2">
              <Layers size={14} /> Maîtrise par thématique
            </h3>
            <p className="flex items-center gap-2 text-xl font-black text-zinc-900 tracking-tight">
              Analyse des sous-compétences
              <InfoTooltip text="Chaque barre est la moyenne de vos scores sur cette catégorie (exercices, examens blancs et sessions orales confondus selon la section)." />
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-8 text-center rounded-[2rem] border-2 border-dashed border-zinc-100">
            <Layers size={40} className="text-zinc-200 mb-3" />
            <p className="text-sm font-bold text-zinc-400">Pas encore assez de données.</p>
            <p className="text-xs text-zinc-300 mt-1">Faites quelques exercices pour voir votre maîtrise par thématique.</p>
          </div>

          <button
            onClick={() => router.push("/tef-irn/practice")}
            className="mt-6 flex w-full items-center justify-center gap-2 h-12 rounded-2xl border-2 border-zinc-100 font-black text-sm text-zinc-600 hover:bg-zinc-50 transition-all"
          >
            S'entraîner
          </button>
        </CardContent>
      </Card>
    );
  }

  // Rétro-compatible : une ligne sans `group` (ancien format, ou source future non prévue)
  // est classée par défaut en "ÉCRIT" plutôt que de disparaître silencieusement.
  const ecrit = data.filter((d) => (d.group_name ?? "ÉCRIT") === "ÉCRIT");
  const oral = data.filter((d) => d.group_name === "ORAL");

  return (
    <Card className="overflow-hidden border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2.5rem]">
      <CardContent className="p-8">
        <div className="mb-8 space-y-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500 flex items-center gap-2">
            <Layers size={14} /> Maîtrise par thématique
          </h3>
          <p className="flex items-center gap-2 text-xl font-black text-zinc-900 tracking-tight">
            Analyse des sous-compétences
            <InfoTooltip text="Chaque barre est la moyenne de vos scores sur cette catégorie (exercices, examens blancs et sessions orales confondus selon la section)." />
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {ecrit.length > 0 && (
            <div>
              <p className="mb-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Écrit</p>
              <SubSkillBarChart data={ecrit} />
            </div>
          )}
          {oral.length > 0 && (
            <div>
              <p className="mb-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Oral</p>
              <SubSkillBarChart data={oral} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

