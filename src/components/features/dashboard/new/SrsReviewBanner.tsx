"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface SrsReviewBannerProps {
  vocabReviewsDue: number;
  exerciseReviewsDue: number;
}

export function SrsReviewBanner({ vocabReviewsDue, exerciseReviewsDue }: SrsReviewBannerProps) {
  const router = useRouter();
  const total = vocabReviewsDue + exerciseReviewsDue;

  if (total === 0) return null;

  return (
    <Card className="overflow-hidden border-none bg-gradient-to-br from-amber-50 to-orange-50 shadow-xl shadow-amber-100/50 rounded-[2.5rem] mb-8 md:mb-12">
      <CardContent className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <Zap size={28} />
          </div>
          <div>
            <p className="text-xl font-black text-zinc-900 tracking-tight">
              {total} révision{total > 1 ? "s" : ""} vous attend{total > 1 ? "ent" : ""} aujourd'hui
            </p>
            <p className="text-xs font-bold text-zinc-500 mt-1">
              {vocabReviewsDue > 0 && `${vocabReviewsDue} mot${vocabReviewsDue > 1 ? "s" : ""} de vocabulaire`}
              {vocabReviewsDue > 0 && exerciseReviewsDue > 0 && " · "}
              {exerciseReviewsDue > 0 && `${exerciseReviewsDue} exercice${exerciseReviewsDue > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {vocabReviewsDue > 0 ? (
          <Button
            onClick={() => router.push("/tef-irn/vocab")}
            className="h-14 rounded-2xl bg-zinc-900 font-black text-sm text-white hover:bg-black transition-all flex items-center gap-2 shrink-0"
          >
            Réviser le vocabulaire <ArrowRight size={18} />
          </Button>
        ) : (
          <Button
            onClick={() => router.push("/tef-irn/parcours")}
            className="h-14 rounded-2xl bg-zinc-900 font-black text-sm text-white hover:bg-black transition-all flex items-center gap-2 shrink-0"
          >
            Voir mes parcours <ArrowRight size={18} />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
