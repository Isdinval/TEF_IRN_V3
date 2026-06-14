"use client";

import { useEffect, useRef } from "react";
import { CorrectionCard } from "./CorrectionCard";
import { ExerciseAttempt } from "@/types/writing";
import { Loader2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface CorrectionListProps {
  attempts: ExerciseAttempt[];
  onSelect: (attempt: ExerciseAttempt) => void;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoading: boolean;
}

export const CorrectionList = ({
  attempts,
  onSelect,
  hasMore,
  onLoadMore,
  isLoading
}: CorrectionListProps) => {
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  if (attempts.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-[3rem] border-2 border-dashed border-zinc-100 shadow-xl shadow-zinc-50">
        <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
          <Inbox size={48} className="text-zinc-200" />
        </div>
        <h3 className="text-2xl font-black text-zinc-900 mb-2">Aucune correction trouvée</h3>
        <p className="text-zinc-500 max-w-sm mb-8 font-medium">
          Vous n'avez pas encore de corrections correspondant à vos critères de recherche.
        </p>
        <Link href="/writing">
          <Button className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black text-white shadow-xl shadow-indigo-100">
            Commencer une rédaction
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {attempts.map((attempt, index) => (
        <CorrectionCard
          key={attempt.id}
          attempt={attempt}
          index={index}
          onClick={() => onSelect(attempt)}
        />
      ))}

      <div ref={observerTarget} className="h-20 flex items-center justify-center">
        {isLoading && (
          <div className="flex items-center gap-2 text-zinc-400 font-bold uppercase tracking-widest text-xs">
            <Loader2 className="animate-spin" size={20} />
            Chargement...
          </div>
        )}
      </div>
    </div>
  );
};
