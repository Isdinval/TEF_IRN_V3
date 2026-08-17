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
  // Nombre de fois où l'erreur à l'origine de cette reco a été relevée
  // (issu de user_errors via le matching category/sub_category avec
  // weak_points -- voir ActionPlanCard). Absent pour les recos sans point
  // faible associé (ex: fallback générique, vocabulaire non lié à user_errors).
  frequency?: number;
  category?: string | null;
  // Tag précis de la taxonomie officielle (docs/lessons-tags-taxonomy.md),
  // transmis à /tef-irn/practice en plus de category (item 8 du plan) --
  // sans lui, le bouton "Commencer maintenant" ne filtrait que sur la
  // catégorie large, jamais sur la notion précise à l'origine de la reco.
  subCategory?: string | null;
  onDismissed?: () => void;
}

const TITLES_BY_TYPE: Record<string, string> = {
  lesson: 'Maîtriser une nouvelle leçon',
  vocab: 'Ancrer un mot de vocabulaire',
};

export function RecommendationCard({ id, type, reason, referenceId, slug, frequency, category, subCategory, onDismissed }: RecommendationCardProps) {
  const router = useRouter();
  const [isDismissing, setIsDismissing] = useState(false);

  const getTargetUrl = () => {
    switch (type) {
      case 'lesson': return `/tef-irn/lessons/${slug || referenceId}`;
      case 'exercise':
      case 'review': {
        if (!category) return '/tef-irn/practice';
        const params = new URLSearchParams({ topic: category });
        if (subCategory) params.set('tag', subCategory);
        return `/tef-irn/practice?${params.toString()}`;
      }
      case 'vocab': return '/tef-irn/vocab';
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
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black leading-tight text-zinc-900">
              {TITLES_BY_TYPE[type] || 'Renforcer vos acquis'}
            </h3>
            {typeof frequency === 'number' && (
              <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-black text-rose-500">×{frequency}</span>
            )}
          </div>
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
