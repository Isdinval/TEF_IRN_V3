"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from "recharts";
import { Radar as RadarIcon } from "lucide-react";
import { motion } from "framer-motion";

const data = [
  { subject: 'ÉCRIT', A: 80, fullMark: 100 },
  { subject: 'ORAL', A: 65, fullMark: 100 },
  { subject: 'RÉDACTION', A: 45, fullMark: 100 },
  { subject: 'PARLER', A: 30, fullMark: 100 },
  { subject: 'GRAMMAIRE', A: 90, fullMark: 100 },
];

export function CompetencyRadar() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <div className="text-center space-y-1">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 flex items-center justify-center gap-2">
          <RadarIcon size={14} /> Analyse de Performance
        </h3>
        <p className="text-xl font-black text-zinc-900 tracking-tight">Radar de Compétences</p>
      </div>

      <div className="h-[280px] w-full relative">
        <div className="absolute inset-0 bg-indigo-500/5 blur-[60px] rounded-full pointer-events-none" />
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#f1f1f1" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#a1a1aa', fontSize: 9, fontWeight: 900, letterSpacing: '0.1em' }}
            />
            <Radar
              name="Niveau Actuel"
              dataKey="A"
              stroke="#4f46e5"
              strokeWidth={3}
              fill="#4f46e5"
              fillOpacity={0.1}
              isAnimationActive={true}
              animationDuration={1500}
              animationBegin={300}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
