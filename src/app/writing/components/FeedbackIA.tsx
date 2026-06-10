"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  ArrowRight,
  Target,
  AlertCircle,
  ChevronRight,
  Info,
  Quote,
  GraduationCap,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WritingFeedback, WritingError } from "@/types/writing";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Lesson {
  id: string;
  title: string;
  category: string;
}

interface FeedbackIAProps {
  feedback: WritingFeedback | null;
  activeErrorIndex: number | null;
  onSelectError: (index: number) => void;
  lessons: Lesson[];
}

export const FeedbackIA = ({
  feedback,
  activeErrorIndex,
  onSelectError,
  lessons,
}: FeedbackIAProps) => {
  const router = useRouter();
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (activeErrorIndex !== null && itemRefs.current[activeErrorIndex]) {
      itemRefs.current[activeErrorIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeErrorIndex]);

  // Matching logic: Find the most relevant lesson for an error
  const findRelevantLesson = useCallback((error: WritingError) => {
    if (!lessons || !lessons.length) return null;

    const errorText = (error.explication + " " + error.type_erreur).toLowerCase();

    let bestMatch: Lesson | null = null;
    let maxScore = 0;

    lessons.forEach((lesson: Lesson) => {
      let score = 0;
      const title = lesson.title.toLowerCase();
      const category = lesson.category.toLowerCase();

      // Prioritize category match
      if (category === error.type_erreur) {
        score += 2;
      } else if (error.type_erreur === "orthographe" && category === "grammaire") {
          score += 1;
      }

      // Keyword matching in title
      const keywords = title.split(/\s+/);
      keywords.forEach((kw: string) => {
        if (kw.length > 3 && errorText.includes(kw)) {
          score += 5;
        }
      });

      // Special cases for common TEF topics
      if (errorText.includes("passé") && title.includes("passé")) score += 10;
      if (errorText.includes("futur") && title.includes("futur")) score += 10;
      if (errorText.includes("subjonctif") && title.includes("subjonctif")) score += 10;
      if (errorText.includes("accord") && title.includes("accord")) score += 10;
      if (errorText.includes("pronom") && title.includes("pronom")) score += 10;

      if (score > maxScore && score > 5) {
        maxScore = score;
        bestMatch = lesson;
      }
    });

    return bestMatch;
  }, [lessons]);

  return (
    <Card className="flex h-full flex-1 shrink-0 flex-col overflow-hidden rounded-[2.5rem] border-none bg-[#111827] shadow-2xl shadow-indigo-900/20">
      <CardHeader className="shrink-0 bg-zinc-900/50 backdrop-blur-md border-b border-white/5 px-8 py-6 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tighter">
            <Sparkles size={20} className="text-indigo-400" /> Feedback IA
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="rounded-xl text-[10px] font-black uppercase tracking-widest text-white/50 hover:bg-white/10 hover:text-white transition-all"
          >
            Quitter <ArrowRight size={14} className="ml-2" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
        <AnimatePresence mode="wait">
          {feedback ? (
            <motion.div
              key="feedback-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex-1 overflow-hidden flex flex-col"
            >
              <ScrollArea className="flex-1">
                <div className="space-y-8 p-8 pb-10">
                  {/* Scores Section */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-indigo-400">Score Global</p>
                      <p className="text-4xl font-black text-white">
                        {feedback.score_global}<span className="text-lg opacity-40">/100</span>
                      </p>
                    </div>
                    <div className="rounded-[2rem] border border-emerald-500/20 bg-emerald-500/5 p-6 text-center flex flex-col justify-center backdrop-blur-sm">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">Niveaux</p>
                      <div className="grid grid-cols-2 gap-1 text-[8px] font-bold uppercase text-emerald-300">
                        <span>Gr: {feedback.scores_par_competence.grammaire}</span>
                        <span>Voc: {feedback.scores_par_competence.vocabulaire}</span>
                        <span>Coh: {feedback.scores_par_competence.coherence}</span>
                        <span>Orth: {feedback.scores_par_competence.orthographe}</span>
                      </div>
                    </div>
                  </div>

                  {/* General Counsel */}
                  <div className="relative rounded-[2rem] border border-white/5 bg-white/5 p-6 text-sm font-medium italic leading-relaxed text-zinc-300">
                    <Quote className="absolute -top-3 left-6 text-white/10" size={24} fill="currentColor" />
                    “{feedback.conseil_general}”
                  </div>

                  {/* Detailed Errors */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                        <Target size={14} className="text-indigo-400" /> Points d'amélioration
                      </h3>
                      <Badge variant="outline" className="text-[9px] font-black border-white/10 text-zinc-400">
                        {feedback.liste_des_erreurs?.length || 0} analyses
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {feedback.liste_des_erreurs?.map((error, index) => {
                        const matchedLesson = findRelevantLesson(error) as Lesson | null;
                        return (
                          <motion.div
                            key={`feedback-item-${index}`}
                            ref={(el) => { itemRefs.current[index] = el; }}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => onSelectError(index)}
                            className={`cursor-pointer rounded-2xl border transition-all ${
                              activeErrorIndex === index
                                ? "scale-[1.02] border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                                : "border-white/5 bg-white/5 hover:border-white/10"
                            }`}
                          >
                            <div className="flex flex-col gap-4 p-5">
                              <div className="flex items-start gap-4">
                                <div className={`mt-1.5 shrink-0 ${
                                  error.type_erreur === "grammaire" ? "text-rose-400" :
                                  error.type_erreur === "orthographe" ? "text-amber-400" :
                                  "text-blue-400"
                                }`}>
                                  {error.type_erreur === "grammaire" ? <AlertCircle size={20} /> : <Info size={20} />}
                                </div>
                                <div className="space-y-2 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium text-zinc-500 line-through">
                                      {error.texte_original}
                                    </span>
                                    <ChevronRight size={12} className="text-zinc-600" />
                                    <span className="text-base font-black italic text-emerald-400 underline decoration-2 underline-offset-4">
                                      {error.texte_corrige}
                                    </span>
                                  </div>
                                  <p className="text-xs font-bold leading-relaxed text-zinc-400">
                                    {error.explication}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-[8px] uppercase tracking-tighter py-0 border-white/10 text-zinc-500">
                                      {error.type_erreur}
                                    </Badge>

                                    {matchedLesson && (
                                      <Link
                                        href={`/lessons/${matchedLesson.id}`}
                                        target="_blank"
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
                                      >
                                        Voir la leçon <ExternalLink size={10} />
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Full Corrected Text */}
                  <div className="mt-10 space-y-4">
                    <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 px-2">
                        <GraduationCap size={14} className="text-emerald-400" /> Texte corrigé complet
                      </h3>
                      <div className="rounded-[2rem] border border-emerald-500/10 bg-emerald-500/5 p-6 text-sm font-medium leading-relaxed text-zinc-300 whitespace-pre-wrap">
                        {feedback.texte_corrige_complet}
                      </div>
                  </div>
                </div>
              </ScrollArea>
            </motion.div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center space-y-6 p-12 text-center">
              <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white/5 border border-white/5">
                <GraduationCap className="text-white/10" size={42} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111827] to-transparent" />
              </div>
              <div className="space-y-2">
                <h3 className="font-black uppercase tracking-tight text-white">En attente de rédaction</h3>
                <p className="mx-auto max-w-[240px] text-xs font-medium italic leading-relaxed text-zinc-500">
                  Complétez votre texte et lancez l'analyse pour recevoir votre feedback premium.
                </p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
