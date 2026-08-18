"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CataloguePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  accentColor?: "indigo" | "purple";
}

const accentClasses: Record<"indigo" | "purple", string> = {
  indigo: "bg-indigo-600 text-white shadow-lg shadow-indigo-100",
  purple: "bg-purple-600 text-white shadow-lg shadow-purple-100",
};

/**
 * Calcule la liste des pages à afficher avec des ellipses ("…") pour éviter
 * une rangée de N boutons quand totalPages est grand. Affiche toujours la
 * première, la dernière, et une fenêtre autour de la page courante.
 */
function getPageWindow(page: number, totalPages: number): (number | "ellipsis")[] {
  const delta = 1;
  const range: number[] = [];
  for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
    range.push(i);
  }

  const result: (number | "ellipsis")[] = [1];
  if (range[0] > 2) result.push("ellipsis");
  result.push(...range);
  if (range[range.length - 1] < totalPages - 1) result.push("ellipsis");
  if (totalPages > 1) result.push(totalPages);

  return result;
}

export function CataloguePagination({ page, totalPages, onPageChange, accentColor = "indigo" }: CataloguePaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageWindow(page, totalPages);

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-8" aria-label="Pagination du catalogue">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="w-9 h-9 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Page précédente"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, idx) =>
        p === "ellipsis" ? (
          <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-zinc-300 text-xs font-black">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={cn(
              "w-9 h-9 rounded-xl text-xs font-black transition-all",
              p === page
                ? accentClasses[accentColor]
                : "bg-white border border-zinc-100 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
            )}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="w-9 h-9 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Page suivante"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
