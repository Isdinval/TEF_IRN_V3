"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ParcoursProgressBarProps {
  percent: number;
  className?: string;
  showLabel?: boolean;
}

export function ParcoursProgressBar({ percent, className, showLabel = false }: ParcoursProgressBarProps) {
  return (
    <div className={cn("w-full space-y-2", className)}>
      {showLabel && (
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
          <span>Progression</span>
          <span>{percent}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn(
            "h-full transition-all",
            percent === 100 ? "bg-emerald-500" : "bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.3)]"
          )}
        />
      </div>
    </div>
  );
}
