"use client";

import { useParcours } from "@/contexts/ParcoursContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  ArrowLeft,
  Play,
  CheckCircle2,
  X,
  BookOpen,
  Layout
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ParcoursProgressBar } from "./ParcoursProgressBar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function ParcoursTopBar() {
  const { activeParcours, loading, getNextLesson, goToNextLesson, quitParcours } = useParcours();
  const pathname = usePathname();
  const router = useRouter();

  // Don't show if no active parcours or if loading
  if (!activeParcours || loading) return null;

  // Don't show on specific pages if needed (e.g. login, onboarding)
  const hiddenRoutes = ["/login", "/onboarding"];
  if (hiddenRoutes.includes(pathname)) return null;

  const nextLesson = getNextLesson();
  const isLessonPage = pathname.startsWith("/lessons/");
  const isParcoursDetail = pathname === `/parcours/${activeParcours.id}`;

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-indigo-100 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="hidden md:flex h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 items-center justify-center shrink-0">
            <BookOpen size={20} />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600/60 leading-none">
                Parcours en cours
              </span>
              <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-bold bg-indigo-50 text-indigo-700 border-indigo-100">
                {activeParcours.level}
              </Badge>
            </div>
            <h3 className="text-sm font-black text-slate-900 truncate capitalize leading-tight">
              {activeParcours.category} {activeParcours.level}
            </h3>
          </div>

          <div className="hidden lg:block w-48 xl:w-64 ml-4">
            <ParcoursProgressBar
              current={activeParcours.progress.completed}
              total={activeParcours.progress.total}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isParcoursDetail && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/parcours/${activeParcours.id}`)}
              className="hidden sm:flex text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 font-bold"
            >
              <Layout size={16} className="mr-2" />
              Retour au parcours
            </Button>
          )}

          {nextLesson && (
            <Button
              size="sm"
              onClick={goToNextLesson}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-200"
            >
              <Play size={14} className="mr-2 fill-current" />
              {isLessonPage ? "Leçon Suivante" : "Continuer"}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={quitParcours}
            className="text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Quitter le parcours"
          >
            <X size={18} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
