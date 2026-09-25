"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ParcoursProgressBarProps {
  percent: number;
  className?: string;
  showLabel?: boolean;
}

// Design system §6.4 : piste indigo-100, remplissage indigo-600, emerald-600 une fois terminé.
// Une seule couleur d'accent sur toutes les pages (§2.2).
export function ParcoursProgressBar({ percent, className, showLabel = false }: ParcoursProgressBarProps) {
  const barColor = percent === 100 ? "bg-emerald-600" : "bg-indigo-600";

  return (
    <div className={cn("w-full space-y-2", className)}>
      {showLabel && (
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
          <span>Progression</span>
          <span>{percent}%</span>
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-indigo-100 dark:bg-zinc-800"
        role="progressbar"
        aria-label="Progression du parcours"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn("h-full rounded-full transition-all", barColor)}
        />
      </div>
    </div>
  );
}
