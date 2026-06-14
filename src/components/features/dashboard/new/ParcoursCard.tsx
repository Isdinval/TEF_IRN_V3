"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Target, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ParcoursCardProps {
  id: string;
  level: string;
  category: string;
  progress: {
    percent: number;
    completed: number;
    total: number;
  };
}

export function ParcoursCard({ id, level, category, progress }: ParcoursCardProps) {
  const router = useRouter();

  return (
    <Card className="group overflow-hidden rounded-[2.5rem] border-none bg-white shadow-xl shadow-zinc-200/50 transition-all hover:-translate-y-1">
      <CardContent className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{level} • {category}</p>
            <h3 className="text-xl font-black text-zinc-900 capitalize">{category} {level}</h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 transition-colors group-hover:bg-violet-600 group-hover:text-white">
            <Target size={24} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-xs font-bold text-zinc-500">
            <span>Progression</span>
            <span>{progress.completed}/{progress.total} leçons</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 p-0.5 border border-zinc-50">
            <div
              className="h-full rounded-full bg-violet-600 shadow-[0_0_10px_rgba(124,58,237,0.3)] transition-all duration-1000"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>

        <Button
          onClick={() => router.push(`/parcours/${id}`)}
          className="mt-8 h-14 w-full rounded-2xl bg-zinc-900 font-black text-sm text-white hover:bg-black transition-all flex items-center justify-center gap-2"
        >
          Continuer <ArrowRight size={18} />
        </Button>
      </CardContent>
    </Card>
  );
}
