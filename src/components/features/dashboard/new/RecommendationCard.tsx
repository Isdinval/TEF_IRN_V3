"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface RecommendationCardProps {
  type: string;
  reason: string;
  referenceId: string;
  slug?: string;
}

export function RecommendationCard({ type, reason, referenceId, slug }: RecommendationCardProps) {
  const router = useRouter();

  const getTargetUrl = () => {
    switch (type) {
      case 'lesson': return `/tef-irn/lessons/${slug || referenceId}`;
      case 'exercise': return '/tef-irn/practice';
      case 'review': return '/tef-irn/practice';
      default: return '/tef-irn/practice';
    }
  };

  return (
    <Card className="group rounded-[2rem] border-none bg-white shadow-xl shadow-zinc-100 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-100">
      <CardContent className="flex gap-6 p-8">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
          <Sparkles size={24} />
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-black leading-tight text-zinc-900">
            {type === 'lesson' ? 'Maîtriser une nouvelle leçon' : 'Renforcer vos acquis'}
          </h3>
          <p className="text-sm font-medium italic leading-relaxed text-zinc-500">
            {reason}
          </p>
          <button
            onClick={() => router.push(getTargetUrl())}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600 transition-all hover:gap-3"
          >
            Commencer maintenant <ArrowRight size={14} />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
