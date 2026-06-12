"use client";

import { motion } from "framer-motion";

interface ParcoursProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export function ParcoursProgressBar({ current, total, className = "" }: ParcoursProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600/70">
          Progression
        </span>
        <span className="text-[10px] font-black text-indigo-600">
          {current}/{total} leçons ({percentage}%)
        </span>
      </div>
      <div className="h-2 w-full bg-indigo-100 rounded-full overflow-hidden border border-indigo-200/50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
        />
      </div>
    </div>
  );
}
