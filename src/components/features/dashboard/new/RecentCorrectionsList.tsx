"use client";

import { motion } from "framer-motion";
import { FileText, CheckCircle2, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface Correction {
  id: string;
  created_at: string;
  score: number;
  exercise: {
    instructions: string;
    type: string;
    category: string;
  };
  ai_feedback?: {
    overall_score: number;
    global_comment: string;
  };
}

export function RecentCorrectionsList({ corrections }: { corrections: Correction[] }) {
  const router = useRouter();

  if (corrections.length === 0) return (
     <div className="flex flex-col items-center justify-center p-12 text-center rounded-[2.5rem] border-2 border-dashed border-zinc-100 bg-white">
        <FileText size={48} className="text-zinc-200 mb-4" />
        <p className="text-sm font-bold text-zinc-400">Aucune correction récente. Commencez un exercice d'expression !</p>
     </div>
  );

  return (
    <div className="space-y-4">
      {corrections.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="group cursor-pointer"
          onClick={() => router.push(`/correction?id=${item.id}`)}
        >
          <div className="p-6 bg-white border border-zinc-100 rounded-[2rem] shadow-sm group-hover:border-indigo-200 group-hover:shadow-xl group-hover:shadow-indigo-100/30 transition-all flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
              <FileText size={28} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-black text-zinc-900 truncate">
                   {item.exercise?.instructions?.substring(0, 50) || "Exercice d'expression"}...
                </h3>
                <Badge className="bg-indigo-50 text-indigo-600 border-none rounded-full px-3 py-1 text-[10px] uppercase font-black tracking-widest">
                  {item.exercise?.type || 'EE'}
                </Badge>
              </div>
              <p className="text-sm text-zinc-500 truncate italic">
                {item.ai_feedback?.global_comment?.substring(0, 80) || "Analyse IA terminée. Consultez votre feedback détaillé."}
              </p>
            </div>

            <div className="text-right hidden sm:block">
              <div className="text-2xl font-black text-zinc-900">
                {item.ai_feedback?.overall_score || item.score || 0}<span className="text-xs text-zinc-400 ml-0.5">/100</span>
              </div>
              <div className="flex items-center gap-1 justify-end text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                 <CheckCircle2 size={12} /> Prêt
              </div>
            </div>

            <ChevronRight size={20} className="text-zinc-300 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
