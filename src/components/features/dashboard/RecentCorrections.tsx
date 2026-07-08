"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface Correction {
  id: string;
  title: string;
  score: number;
  type: string;
  date: string;
  feedback_summary: string;
}

export function RecentCorrections({ corrections }: { corrections: any[] }) {
  const router = useRouter();

  if (corrections.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">Corrections Récentes</h2>
        <button
          onClick={() => router.push('/tef-irn/correction')}
          className="text-xs font-bold text-indigo-600 hover:underline"
        >
          Tout voir
        </button>
      </div>

      <div className="space-y-3">
        {corrections.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group cursor-pointer"
            onClick={() => router.push(`/tef-irn/correction?id=${item.id}`)}
          >
            <div className="p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm group-hover:border-indigo-200 group-hover:shadow-md transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <FileText size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-zinc-900 truncate">{item.exercises?.instructions?.substring(0, 40) || "Exercice d'expression"}...</h3>
                  <Badge variant="outline" className="text-[10px] uppercase font-black tracking-tighter h-5 px-1.5 border-zinc-200">
                    {item.exercises?.type || 'EE'}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-500 truncate italic">
                  {item.ai_feedback?.[0]?.global_comment?.substring(0, 60) || "Analyse IA terminée."}
                </p>
              </div>

              <div className="text-right">
                <div className="text-lg font-black text-zinc-900">
                  {item.ai_feedback?.[0]?.overall_score || 0}<span className="text-[10px] text-zinc-400">/100</span>
                </div>
                <div className="flex items-center gap-1 justify-end text-[10px] font-bold text-zinc-400 uppercase">
                   <CheckCircle2 size={10} className="text-emerald-500" /> Prêt
                </div>
              </div>

              <ChevronRight size={16} className="text-zinc-300 group-hover:text-indigo-600 transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
