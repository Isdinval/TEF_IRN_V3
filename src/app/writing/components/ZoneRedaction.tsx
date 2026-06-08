"use client";

import React, { useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PenTool, Sparkles, Loader2, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WritingFeedback } from "@/types/writing";

interface ZoneRedactionProps {
  text: string;
  setText: (text: string) => void;
  isAnalyzing: boolean;
  feedback: WritingFeedback | null;
  activeErrorIndex: number | null;
  onAnalyze: () => void;
  onReset: () => void;
  onSelectError: (index: number) => void;
  wordCount: number;
}

export const ZoneRedaction = ({
  text,
  setText,
  isAnalyzing,
  feedback,
  activeErrorIndex,
  onAnalyze,
  onReset,
  onSelectError,
  wordCount,
}: ZoneRedactionProps) => {
  const errorRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (activeErrorIndex !== null && errorRefs.current[activeErrorIndex]) {
      errorRefs.current[activeErrorIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeErrorIndex]);

  const highlightedText = React.useMemo(() => {
    if (!feedback?.liste_des_erreurs || feedback.liste_des_erreurs.length === 0) {
      return text;
    }

    let lastIndex = 0;
    const parts: (string | JSX.Element)[] = [];

    const sortedErrors = [...feedback.liste_des_erreurs].sort((a, b) => a.position_dans_texte - b.position_dans_texte);

    sortedErrors.forEach((error) => {
      const originalIndex = feedback.liste_des_erreurs.indexOf(error);

      if (error.position_dans_texte > lastIndex) {
        parts.push(text.substring(lastIndex, error.position_dans_texte));
      }

      const fragment = text.substring(error.position_dans_texte, error.position_dans_texte + error.texte_original.length);

      parts.push(
        <motion.span
          key={`error-${originalIndex}`}
          ref={(el) => { errorRefs.current[originalIndex] = el; }}
          whileHover={{ scale: 1.02 }}
          onClick={() => onSelectError(originalIndex)}
          className={`cursor-pointer rounded-sm border-b-2 px-0.5 transition-all duration-200 ${
            activeErrorIndex === originalIndex
              ? "border-indigo-600 bg-indigo-200 shadow-sm"
              : error.type_erreur === "grammaire"
              ? "border-rose-400 bg-rose-100/50 hover:bg-rose-200"
              : error.type_erreur === "orthographe"
              ? "border-amber-400 bg-amber-100/50 hover:bg-amber-200"
              : "border-blue-400 bg-blue-100/50 hover:bg-blue-200"
          }`}
        >
          {fragment || error.texte_original}
        </motion.span>
      );

      lastIndex = error.position_dans_texte + error.texte_original.length;
    });

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  }, [feedback, text, activeErrorIndex, onSelectError]);

  return (
    <Card className="flex min-h-[680px] flex-1 flex-col overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl shadow-zinc-200/50">
      <CardHeader className="flex shrink-0 flex-row items-center justify-between border-b border-zinc-100 bg-zinc-50 px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xl shadow-zinc-200">
            <PenTool size={20} />
          </div>
          <div>
            <CardTitle className="text-sm font-black uppercase tracking-tight">Zone de rédaction</CardTitle>
            <p className="text-[10px] font-bold text-zinc-400">Écrivez votre texte ci-dessous</p>
          </div>
        </div>
        {isAnalyzing && (
           <Badge className="animate-pulse border-none bg-indigo-100 text-[9px] font-black uppercase tracking-widest text-indigo-700">
             Correction en cours...
           </Badge>
        )}
        {feedback && !isAnalyzing && (
          <Badge className="border-none bg-emerald-100 text-[9px] font-black uppercase tracking-widest text-emerald-700">
            Analyse terminée
          </Badge>
        )}
      </CardHeader>

      <CardContent className="relative flex-1 overflow-hidden p-0">
        <AnimatePresence mode="wait">
          {!feedback ? (
            <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <Textarea
                placeholder="Débutez votre rédaction ici..."
                className="h-full w-full resize-none border-0 bg-transparent p-10 text-xl font-medium leading-relaxed text-zinc-800 focus-visible:ring-0"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isAnalyzing}
              />
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full overflow-auto bg-white p-10 text-xl font-medium leading-relaxed text-zinc-800"
            >
              <div className="whitespace-pre-wrap">{highlightedText}</div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute bottom-8 left-1/2 w-full max-w-sm -translate-x-1/2 px-6">
          {!feedback ? (
            <Button
              onClick={onAnalyze}
              disabled={isAnalyzing || wordCount < 5}
              className="h-16 w-full rounded-2xl bg-zinc-900 text-lg font-black text-white shadow-2xl shadow-zinc-300 transition-all hover:bg-zinc-800 active:scale-95"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={24} /> ANALYSE...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2" size={24} /> LANCER L'ANALYSE
                </>
              )}
            </Button>
          ) : (
            <Button onClick={onReset} className="h-14 w-full rounded-2xl bg-white font-black text-zinc-900 shadow-xl shadow-zinc-200 hover:bg-zinc-50 border border-zinc-100">
              <RotateCcw size={18} className="mr-2" /> Retravailler mon texte
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
