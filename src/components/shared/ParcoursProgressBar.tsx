"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ParcoursProgressBarProps {
  percent: number;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ParcoursProgressBar({
  percent,
  className,
  showLabel = false,
  size = "md"
}: ParcoursProgressBarProps) {
  const heights = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4"
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      {showLabel && (
        <div className="flex justify-between items-end mb-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Progression</span>
          <span className="text-sm font-black text-indigo-600">{percent}%</span>
        </div>
      )}
      <div className={cn("w-full overflow-hidden rounded-full bg-zinc-100", heights[size])}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.3)]"
        />
      </div>
    </div>
  );
}
