"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface RecommendationCardProps {
  id: string;
  type: string;
  reason: string;
  referenceId: string;
  slug?: string;
  onDismissed?: () => void;
}

export function RecommendationCard({ id, type, reason, referenceId, slug, onDismissed }: RecommendationCardProps) {
  const router = useRouter();
  const [isDismissing, setIsDismissing] = useState(false);

  const getTargetUrl = () => {
    switch (type) {
      case 'lesson': return `/tef-irn/lessons/${slug || referenceId}`;
      case 'exercise': return '/tef-irn/practice';
      case 'review': return '/tef-irn/practice';
      default: return '/tef-irn/practice';
    }
  };

  const handleDismiss = async () => {
    setIsDismissing(true);
    try {
      await fetch('/api/recommendations/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId: id })
      });
      onDismissed?.();
    } catch (err) {
      console.error("Dismiss recommendation error:", err);
      setIsDismissing(false);
    }
  };

  return (
    <Card className="group relative rounded-[2rem] border-none bg-white shadow-xl shadow-zinc-100 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-100">
      <button
        onClick={handleDismiss}
        disabled={isDismissing}
        aria-label="Ignorer cette recommandation"
        className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-500 disabled:opacity-50"
      >
        <X size={16} />
      </button>
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
