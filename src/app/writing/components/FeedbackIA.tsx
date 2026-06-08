"use client";

import React, { useRef, useEffect } from "react";
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
} from "lucide-react";
import { motion } from "framer-motion";
import { WritingFeedback } from "@/types/writing";
import { useRouter } from "next/navigation";

interface FeedbackIAProps {
  feedback: WritingFeedback | null;
  activeErrorIndex: number | null;
  onSelectError: (index: number) => void;
}

export const FeedbackIA = ({
  feedback,
  activeErrorIndex,
  onSelectError,
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

  return (
    <Card className="flex min-h-[680px] flex-1 shrink-0 flex-col overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl shadow-indigo-100/50">
      <CardHeader className="shrink-0 bg-zinc-900 px-8 py-6 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tighter">
            <Sparkles size={20} className="text-indigo-400" /> Feedback IA
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="rounded-xl text-[10px] font-black uppercase tracking-widest text-white/70 hover:bg-white/10 hover:text-white"
          >
            Quitter <ArrowRight size={14} className="ml-2" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
        {feedback ? (
          <ScrollArea className="flex-1">
            <div className="space-y-8 p-8 pb-10">
              {/* Scores Section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[2rem] border border-indigo-100 bg-indigo-50 p-6 text-center">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-indigo-400">Score Global</p>
                  <p className="text-4xl font-black text-indigo-900">
                    {feedback.score_global}<span className="text-lg opacity-40">/100</span>
                  </p>
                </div>
                <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-6 text-center flex flex-col justify-center">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-emerald-500">Niveaux</p>
                  <div className="grid grid-cols-2 gap-1 text-[8px] font-bold uppercase text-emerald-700">
                    <span>Gr: {feedback.scores_par_competence.grammaire}</span>
                    <span>Voc: {feedback.scores_par_competence.vocabulaire}</span>
                    <span>Coh: {feedback.scores_par_competence.coherence}</span>
                    <span>Orth: {feedback.scores_par_competence.orthographe}</span>
                  </div>
                </div>
              </div>

              {/* General Counsel */}
              <div className="relative rounded-[2rem] border border-zinc-100 bg-zinc-50 p-6 text-sm font-medium italic leading-relaxed text-zinc-600">
                <Quote className="absolute -top-3 left-6 text-zinc-200" size={24} fill="currentColor" />
                “{feedback.conseil_general}”
              </div>

              {/* Detailed Errors */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                    <Target size={14} className="text-indigo-600" /> Points d'amélioration
                  </h3>
                  <Badge variant="outline" className="text-[9px] font-black">
                    {feedback.liste_des_erreurs?.length || 0} analyses
                  </Badge>
                </div>

                <div className="space-y-3">
                  {feedback.liste_des_erreurs?.map((error, index) => (
                    <motion.div
                      key={`feedback-item-${index}`}
                      ref={(el) => { itemRefs.current[index] = el; }}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => onSelectError(index)}
                      className={`cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                        activeErrorIndex === index
                          ? "scale-[1.02] border-indigo-600 bg-indigo-50/30 shadow-lg"
                          : "border-zinc-50 bg-zinc-50/50 hover:border-zinc-100"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`mt-1.5 shrink-0 ${
                          error.type_erreur === "grammaire" ? "text-rose-500" :
                          error.type_erreur === "orthographe" ? "text-amber-500" :
                          "text-blue-500"
                        }`}>
                          {error.type_erreur === "grammaire" ? <AlertCircle size={20} /> : <Info size={20} />}
                        </div>
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-zinc-400 line-through">
                              {error.texte_original}
                            </span>
                            <ChevronRight size={12} className="text-zinc-300" />
                            <span className="text-base font-black italic text-emerald-600 underline decoration-2 underline-offset-4">
                              {error.texte_corrige}
                            </span>
                          </div>
                          <p className="text-xs font-bold leading-relaxed text-zinc-500">
                            {error.explication}
                          </p>
                          <Badge variant="outline" className="text-[8px] uppercase tracking-tighter py-0">
                            {error.type_erreur}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Full Corrected Text */}
              <div className="mt-10 space-y-4">
                 <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-2">
                    <GraduationCap size={14} className="text-emerald-600" /> Texte corrigé complet
                  </h3>
                  <div className="rounded-[2rem] border border-emerald-50 bg-emerald-50/30 p-6 text-sm font-medium leading-relaxed text-zinc-700 whitespace-pre-wrap">
                    {feedback.texte_corrige_complet}
                  </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center space-y-6 p-12 text-center">
            <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-zinc-50">
              <GraduationCap className="text-zinc-200" size={42} />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 to-transparent" />
            </div>
            <div className="space-y-2">
              <h3 className="font-black uppercase tracking-tight text-zinc-900">En attente de rédaction</h3>
              <p className="mx-auto max-w-[240px] text-xs font-medium italic leading-relaxed text-zinc-400">
                Complétez votre texte et lancez l'analyse pour recevoir votre feedback premium.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
