"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseLayoutProps {
  title: string;
  badge: string;
  description?: string;
  variant?: "full" | "compact";
  badgeColor?: "indigo" | "emerald" | "purple";
  onBack?: () => void;
  children?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function ExerciseLayout({
  title,
  badge,
  description,
  variant = "full",
  badgeColor = "indigo",
  onBack,
  children,
  rightElement,
}: ExerciseLayoutProps) {
  const colorClasses = {
    indigo: "bg-indigo-600 shadow-indigo-100 text-white border-none",
    emerald: "bg-emerald-600 shadow-emerald-100 text-white border-none",
    purple: "bg-purple-600 shadow-purple-100 text-white border-none",
  };

  const badgeClass = cn(
    "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest shadow-lg transition-colors",
    colorClasses[badgeColor]
  );

  if (variant === "compact") {
    return (
      <header className="bg-white border-b border-zinc-100 px-6 py-3 lg:px-12 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            {onBack && (
              <button
                onClick={onBack}
                className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all group"
              >
                <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-3 mb-0.5">
                <Badge className={cn(badgeClass, "px-2 py-0 h-4 text-[8px]")}>{badge}</Badge>
              </div>
              <h1 className="text-lg font-black text-zinc-900 uppercase tracking-tight">
                {title}
              </h1>
            </div>
          </div>
          {rightElement && <div>{rightElement}</div>}
        </div>
      </header>
    );
  }

  return (
    <div className="w-full">
      <section className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2 max-w-2xl"
          >
            <Badge className={badgeClass}>{badge}</Badge>
            <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-tight">
              {title}
            </h1>
            {description && (
              <p className="text-zinc-500 text-sm font-medium leading-relaxed italic">
                "{description}"
              </p>
            )}
          </motion.div>
          {rightElement && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {rightElement}
            </motion.div>
          )}
        </div>
        <div className="h-px w-full bg-gradient-to-r from-zinc-200 via-zinc-100 to-transparent mb-8" />
        {children}
      </section>
    </div>
  );
}
