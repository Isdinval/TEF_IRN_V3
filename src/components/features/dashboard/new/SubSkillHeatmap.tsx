"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Layers } from "lucide-react";

interface SubSkillData {
  label: string;
  score: number;
  count: number;
}

export function SubSkillHeatmap({ data }: { data: SubSkillData[] }) {
  if (!data || data.length === 0) return null;

  return (
    <Card className="overflow-hidden border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2.5rem]">
      <CardContent className="p-8">
        <div className="mb-8 space-y-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500 flex items-center gap-2">
            <Layers size={14} /> Maîtrise par thématique
          </h3>
          <p className="text-xl font-black text-zinc-900 tracking-tight">Analyse des sous-compétences</p>
        </div>

        <div className="h-[250px] w-full">
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
      </CardContent>
    </Card>
  );
}
