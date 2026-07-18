"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface XPChartData {
  day: string;
  xp: number;
}

export function XPChart({ data }: { data: XPChartData[] }) {
  const hasActivity = data.some((d) => d.xp > 0);

  return (
    <Card className="overflow-hidden border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2.5rem]">
      <CardContent className="p-8">
        <div className="mb-8 space-y-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
            <Activity size={14} /> Activité hebdomadaire
          </h3>
          <p className="text-xl font-black text-zinc-900 tracking-tight">Progression XP</p>
        </div>

        <div className="h-[200px] w-full">
          {!hasActivity ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-center">
              <p className="text-sm font-bold text-zinc-400">Pas encore d'activité cette semaine</p>
              <p className="text-xs text-zinc-300">Fais un exercice pour voir ta progression ici</p>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 700 }}
              />
              <Tooltip
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ fontWeight: 900, color: '#18181b' }}
              />
              <Area
                type="monotone"
                dataKey="xp"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorXp)"
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
