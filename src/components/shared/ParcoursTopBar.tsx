"use client";

import { useParcours } from "@/contexts/ParcoursContext";
import { ParcoursProgressBar } from "./ParcoursProgressBar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export function ParcoursTopBar() {
  const { activeParcours, progress, nextLesson, isLoading } = useParcours();
  const pathname = usePathname();

  // Show TopBar even during lesson reading/quiz if it's part of a parcours context
  // But we hide it for absolute immersion if requested, but here user wants it visible during quiz
  if (!activeParcours || isLoading) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        exit={{ y: -100 }}
        className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-zinc-100 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:block">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-0.5">
                Parcours en cours
              </span>
              <h4 className="text-sm font-black text-slate-900 capitalize truncate max-w-[200px]">
                {activeParcours.category} {activeParcours.level}
              </h4>
            </div>

            <Link href={`/tef-irn/parcours/${activeParcours.slug}`}>
              <Button variant="ghost" size="sm" className="h-8 text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                <ArrowLeft size={14} className="mr-1" /> Retour
              </Button>
            </Link>
          </div>

          <div className="flex-1 max-w-md hidden md:block">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                {progress?.completed} / {progress?.total} leçons
              </span>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                {progress?.percent}%
              </span>
            </div>
            <ParcoursProgressBar percent={progress?.percent || 0} />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => nextLesson()}
              size="sm"
              className="h-10 px-4 bg-zinc-900 hover:bg-black text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-zinc-200 transition-all active:scale-95"
            >
              Leçon suivante <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>

        <div className="md:hidden h-1 w-full bg-zinc-50">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress?.percent}%` }}
            className="h-full bg-indigo-600"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
