"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const data = [
  { subject: 'Écrit (CE)', A: 80, fullMark: 100 },
  { subject: 'Oral (CO)', A: 65, fullMark: 100 },
  { subject: 'Rédaction (EE)', A: 45, fullMark: 100 },
  { subject: 'Parler (EO)', A: 30, fullMark: 100 },
  { subject: 'Grammaire', A: 90, fullMark: 100 },
];

export function CompetencyRadar() {
  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0">
        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Radar de Compétences</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] p-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
            <Radar
              name="Niveau Actuel"
              dataKey="A"
              stroke="#4f46e5"
              fill="#4f46e5"
              fillOpacity={0.2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
