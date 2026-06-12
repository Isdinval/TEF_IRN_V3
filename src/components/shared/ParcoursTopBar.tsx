"use client";

import { useParcours } from "@/contexts/ParcoursContext";
import { ParcoursProgressBar } from "./ParcoursProgressBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, X, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export function ParcoursTopBar() {
  const { activeParcours, progress, nextLesson, exitParcours } = useParcours();
  const pathname = usePathname();

  // Don't show on specific pages if needed, but the goal is persistence.
  // We avoid showing it on the landing page or login.
  const isPublicPage = ["/", "/login", "/signup", "/pricing"].includes(pathname);
  if (isPublicPage || !activeParcours) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        exit={{ y: -100 }}
        className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-zinc-100 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4 md:gap-8">
          {/* Info & Progress */}
          <div className="flex-1 flex items-center gap-4 min-w-0">
            <div className="hidden sm:flex flex-col">
              <div className="flex items-center gap-2">
                <Badge className="bg-indigo-600 text-[10px] h-4 px-2 font-black uppercase">
                  {activeParcours.level}
                </Badge>
                <span className="text-xs font-black text-slate-900 uppercase tracking-tight truncate max-w-[150px]">
                  {activeParcours.category}
                </span>
              </div>
            </div>

            <div className="flex-1 max-w-md">
              <ParcoursProgressBar
                percent={progress?.percent || 0}
                size="sm"
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                  {progress?.completed} / {progress?.total} leçons
                </span>
                <span className="text-[9px] font-black text-indigo-600">
                  {progress?.percent}%
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link href={`/parcours/${activeParcours.id}`}>
              <Button variant="ghost" size="sm" className="hidden md:flex font-black text-xs uppercase tracking-widest text-zinc-500 hover:text-indigo-600">
                <ArrowLeft size={14} className="mr-2" />
                Retour au parcours
              </Button>
            </Link>

            {nextLesson && pathname !== `/lessons/${nextLesson.id}` && (
              <Link href={`/lessons/${nextLesson.id}?parcoursId=${activeParcours.id}`}>
                <Button size="sm" className="bg-zinc-900 hover:bg-black text-white font-black text-xs uppercase tracking-widest px-4 h-9 rounded-xl shadow-lg shadow-zinc-200">
                  <Play size={14} className="mr-2" fill="currentColor" />
                  Continuer
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={exitParcours}
              className="h-9 w-9 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
              title="Sortir du mode parcours"
            >
              <X size={18} />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
