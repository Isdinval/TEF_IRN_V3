"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface ParcoursProgressBarProps {
  percent: number;
  className?: string;
  showLabel?: boolean;
}

export function ParcoursProgressBar({ percent, className, showLabel = false }: ParcoursProgressBarProps) {
  const pathname = usePathname();

  // Use page-specific colors for the progress bar if we are in an exercise
  let barColor = "bg-indigo-600";
  if (percent === 100) {
    barColor = "bg-emerald-500";
  } else if (pathname.includes("/practice")) {
    barColor = "bg-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.3)]";
  } else if (pathname.includes("/grammar-check")) {
    barColor = "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]";
  } else if (pathname.includes("/vocab")) {
    barColor = "bg-emerald-600 shadow-[0_0_10px_rgba(5,150,105,0.3)]";
  } else {
    barColor = "bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.3)]";
  }

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
          className={cn("h-full transition-all", barColor)}
        />
      </div>
    </div>
  );
}
