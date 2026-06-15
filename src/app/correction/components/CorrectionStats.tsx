"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Trophy,
  Target,
  BarChart3,
  TrendingUp,
  History
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { motion } from "framer-motion";
import { ExerciseAttempt } from "@/types/writing";

interface CorrectionStatsProps {
  attempts: ExerciseAttempt[];
}

export const CorrectionStats = ({ attempts }: CorrectionStatsProps) => {
  const total = attempts.length;
  const avgScore = total > 0
    ? Math.round(attempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / total)
    : 0;

  const bestScore = total > 0
    ? Math.max(...attempts.map(a => a.score || 0))
    : 0;

  const latestScore = total > 0 ? attempts[0].score || 0 : 0;

  const chartData = [...attempts]
    .reverse()
    .slice(-15)
    .map((a, i) => ({
      index: i + 1,
      score: a.score || 0,
      date: new Date(a.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Corrections", value: total, icon: History, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Score Moyen", value: `${avgScore}%`, icon: BarChart3, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Record", value: `${bestScore}%`, icon: Trophy, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Dernier", value: `${latestScore}%`, icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-xl shadow-zinc-100 overflow-hidden rounded-3xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                </div>
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                <h4 className="text-3xl font-black text-zinc-900 tracking-tighter">{stat.value}</h4>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-none shadow-xl shadow-zinc-100 rounded-[2.5rem] overflow-hidden bg-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
                  <TrendingUp className="text-indigo-600" size={24} />
                  Évolution de vos scores
                </h3>
                <p className="text-sm font-medium text-zinc-400">Progression sur les 15 dernières tentatives</p>
              </div>
            </div>

            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                    dy={10}
                  />
                  <YAxis
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#4f46e5"
                    strokeWidth={4}
                    dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#4f46e5', strokeWidth: 3, stroke: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
