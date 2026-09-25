"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Target, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ParcoursCardProps {
  id: string;
  slug: string;
  level: string;
  category: string;
  progress: {
    percent: number;
    completed: number;
    total: number;
  };
}

export function ParcoursCard({ id, slug, level, category, progress }: ParcoursCardProps) {
  const router = useRouter();

  return (
    <Card className="group overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm transition-all hover:-translate-y-1">
      <CardContent className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-1">{level} • {category}</p>
            <h3 className="text-xl font-black text-zinc-900 capitalize">{category} {level}</h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
            <Target size={24} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm font-bold text-zinc-500">
            <span>Progression</span>
            <span>{progress.completed || 0}/{progress.total || 0} leçons</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 p-0.5 border border-zinc-50">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-1000"
              style={{ width: `${progress.percent || 0}%` }}
            />
          </div>
        </div>

        <Button
          onClick={() => router.push(`/tef-irn/parcours/${slug}`)}
          className="mt-8 h-14 w-full rounded-2xl bg-indigo-600 font-black uppercase tracking-widest text-sm text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
        >
          {progress.percent > 0 ? "Continuer" : "Commencer"} <ArrowRight size={18} />
        </Button>
      </CardContent>
    </Card>
  );
}
