"use client";

import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Sparkles,
  Download,
  RotateCcw,
  Quote,
  Target,
  AlertCircle,
  Info,
  CheckCircle2,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ExerciseAttempt, WritingFeedback, LegacyFeedback, WritingError } from "@/types/writing";
import { OralAnalysisView } from "../../oral/components/OralAnalysisView";
import { OralAnalysis, OralTurn } from "@/lib/oral-criteria";

interface CorrectionDetailViewProps {
  attempt: ExerciseAttempt;
  onBack: () => void;
  onRestart: (attempt: ExerciseAttempt) => void;
  onExport: (attempt: ExerciseAttempt) => void;
  isExporting: boolean;
}

// Branche EO : correction_all_attempts (item 1) façonne answers.feedback avec les
// mêmes clés que oral_session_results (scores/strengths/improvements/general_comment/
// estimated_level) -- on réutilise donc OralAnalysisView tel quel plutôt que de
// dupliquer un rendu, seul overall_score vient d'ailleurs (attempt.score, pas dans
// feedback). Restart renvoie déjà vers /tef-irn/oral (voir page.tsx::handleRestart) ;
// pas d'export PDF pour l'EO, /api/correction/pdf ne lit que exercise_attempts (EE).
const OralCorrectionDetail = ({
  attempt,
  onBack,
  onRestart
}: Pick<CorrectionDetailViewProps, "attempt" | "onBack" | "onRestart">) => {
  const feedback = attempt.answers.feedback as any;
  const analysis: OralAnalysis = {
    overall_score: attempt.score || 0,
    estimated_level: feedback?.estimated_level || "A2",
    scores: feedback?.scores || {},
    strengths: feedback?.strengths || [],
    improvements: feedback?.improvements || [],
    general_comment: feedback?.general_comment || "",
  };
  const transcript: OralTurn[] = (attempt.answers as any)?.transcript || [];

  return (
    <div className="space-y-6 pb-20">
      <Button
        variant="ghost"
        onClick={onBack}
        className="rounded-2xl font-black text-zinc-500 hover:bg-white hover:text-zinc-900"
      >
        <ArrowLeft size={18} className="mr-2" /> Retour à l'historique
      </Button>
      <OralAnalysisView
        analysis={analysis}
        transcript={transcript}
        onRestart={() => onRestart(attempt)}
      />
    </div>
  );
};

export const CorrectionDetailView = ({
  attempt,
  onBack,
  onRestart,
  onExport,
  isExporting
}: CorrectionDetailViewProps) => {
  const [activeErrorIndex, setActiveErrorIndex] = useState<number | null>(null);

  const feedback = attempt.answers.feedback;
  const isLegacy = !('liste_des_erreurs' in (feedback || {}));
  const isExamBlanc = attempt.context === "exam" || attempt.source === "scenario";

  const level = (feedback as WritingFeedback)?.level || (feedback as LegacyFeedback)?.level || "B1";
  const comment = (feedback as WritingFeedback)?.conseil_general || (feedback as LegacyFeedback)?.comment || "";
  const improved = (feedback as WritingFeedback)?.texte_corrige_complet || (feedback as LegacyFeedback)?.improved || "";

  const errors = useMemo(() => {
    if (!feedback) return [];
    if (isLegacy) {
      return (feedback as LegacyFeedback).annotations.map(ann => ({
        texte_original: ann.original_fragment,
        texte_corrige: ann.correction,
        explication: ann.explanation,
        type_erreur: ann.type as any
      }));
    }
    return (feedback as WritingFeedback).liste_des_erreurs;
  }, [feedback, isLegacy]);

  const highlightedText = useMemo(() => {
    // Fallback "" : pour une tentative EO (rendu court-circuité ci-dessous, après
    // les hooks pour respecter les Rules of Hooks), attempt.answers n'a pas de
    // champ text -- ce calcul tourne quand même mais son résultat n'est jamais
    // affiché.
    const text = attempt.answers.text || "";
    if (errors.length === 0) return text;

    let currentSearchIndex = 0;
    const matchedErrors = errors.map((error, index) => {
      let position = text.indexOf(error.texte_original, currentSearchIndex);
      if (position === -1) position = text.indexOf(error.texte_original);

      if (position !== -1) {
        currentSearchIndex = position + error.texte_original.length;
        return { ...error, position, originalIndex: index };
      }
      return null;
    }).filter(Boolean) as any[];

    matchedErrors.sort((a, b) => a.position - b.position);

    let lastIndex = 0;
    const parts: (string | JSX.Element)[] = [];

    matchedErrors.forEach((error, idx) => {
      if (error.position < lastIndex) return;
      if (error.position > lastIndex) {
        parts.push(text.substring(lastIndex, error.position));
      }

      parts.push(
        <motion.span
          key={`err-${idx}`}
          whileHover={{ scale: 1.05 }}
          onMouseEnter={() => setActiveErrorIndex(error.originalIndex)}
          onMouseLeave={() => setActiveErrorIndex(null)}
          className={`cursor-help rounded-md px-1 transition-all duration-200 ${
            activeErrorIndex === error.originalIndex
              ? "bg-indigo-600 text-white shadow-lg"
              : error.type_erreur === "grammaire" || error.type_erreur === "error"
              ? "bg-rose-100 text-rose-700 border-b-2 border-rose-400"
              : "bg-amber-100 text-amber-700 border-b-2 border-amber-400"
          }`}
        >
          {text.substring(error.position, error.position + error.texte_original.length)}
        </motion.span>
      );

      lastIndex = error.position + error.texte_original.length;
    });

    if (lastIndex < text.length) parts.push(text.substring(lastIndex));
    return parts;
  }, [errors, attempt.answers.text, activeErrorIndex]);

  // Placé après tous les hooks ci-dessus (Rules of Hooks : un hook ne peut pas
  // être appelé conditionnellement) -- leur résultat est calculé mais ignoré
  // pour une tentative EO, qui court-circuite ici vers le rendu dédié.
  if (attempt.skill === "EO") {
    return <OralCorrectionDetail attempt={attempt} onBack={onBack} onRestart={onRestart} />;
  }

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-2xl bg-white shadow-xl shadow-zinc-100 hover:bg-zinc-50 h-14 w-14"
          >
            <ArrowLeft size={24} />
          </Button>
          <div>
            <Badge className="mb-2 rounded-full border-none bg-indigo-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100">
              Analyse détaillée
            </Badge>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900">
              {attempt.answers.subject || attempt.exercise?.instructions || "Expression Écrite"}
            </h1>
            <p className="text-sm font-bold text-zinc-400 flex items-center gap-2 mt-1">
              {new Date(attempt.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              <span className="w-1 h-1 rounded-full bg-zinc-300" />
              Score : {attempt.score}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => onRestart(attempt)}
            className="h-14 rounded-2xl bg-white border border-zinc-100 px-6 font-black text-zinc-900 shadow-xl shadow-zinc-100 hover:bg-zinc-50"
          >
            <RotateCcw size={18} className="mr-2" /> Recommencer
          </Button>
          <Button
            onClick={() => onExport(attempt)}
            disabled={isExporting || isExamBlanc}
            title={isExamBlanc ? "Export PDF bientôt disponible pour les examens blancs" : undefined}
            className="h-14 rounded-2xl bg-zinc-900 px-6 font-black text-white shadow-xl shadow-zinc-200 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isExporting ? <Sparkles className="animate-spin" /> : <Download size={18} className="mr-2" />}
            Export PDF
          </Button>
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Left Col: Original Text */}
        <Card className="rounded-[3rem] border-none bg-white shadow-2xl shadow-zinc-100 overflow-hidden sticky top-8">
          <CardHeader className="border-b border-zinc-50 bg-zinc-50/50 px-10 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white rounded-xl shadow-sm text-zinc-400">
                  <FileText size={20} />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Votre production</p>
              </div>
              <Badge variant="outline" className="rounded-full border-zinc-200 bg-white font-bold text-[10px]">
                {attempt.answers.text.trim().split(/\s+/).length} mots
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <div className="text-xl font-medium leading-relaxed text-zinc-800 whitespace-pre-wrap">
              {highlightedText}
            </div>
          </CardContent>
        </Card>

        {/* Right Col: AI Feedback */}
        <div className="space-y-8">
          {/* General Comment */}
          <Card className="rounded-[3rem] border-none bg-zinc-900 shadow-2xl shadow-zinc-900/20 overflow-hidden">
            <CardContent className="p-10 relative">
              <Quote className="absolute top-8 right-8 text-white/5" size={80} />
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-indigo-400" size={20} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Conseil du Coach</span>
                </div>
                <p className="text-lg font-medium italic leading-relaxed text-zinc-300">
                  {comment}
                </p>
                <div className="flex items-center gap-4 pt-4">
                  <div className="flex-1 h-px bg-white/10" />
                  <Badge className="bg-indigo-600 text-white font-black border-none uppercase px-4">
                    Niveau {level}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Annotations */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-zinc-400 px-4">
              <Target size={18} className="text-indigo-600" />
              Corrections détaillées
            </h3>
            <div className="space-y-4">
              {errors.map((err, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onMouseEnter={() => setActiveErrorIndex(idx)}
                  onMouseLeave={() => setActiveErrorIndex(null)}
                >
                  <Card className={`rounded-3xl border-none transition-all duration-300 ${
                    activeErrorIndex === idx
                    ? "bg-indigo-50 shadow-xl shadow-indigo-100 ring-2 ring-indigo-600"
                    : "bg-white shadow-xl shadow-zinc-100"
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 p-2 rounded-xl ${
                          err.type_erreur === 'grammaire' || err.type_erreur === 'error'
                          ? "bg-rose-50 text-rose-600"
                          : "bg-amber-50 text-amber-600"
                        }`}>
                          {err.type_erreur === 'grammaire' || err.type_erreur === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}
                        </div>
                        <div className="space-y-4 flex-1">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Original</p>
                              <p className="text-sm font-bold text-zinc-500 line-through decoration-rose-400 decoration-2">
                                {err.texte_original}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Correction</p>
                              <p className="text-sm font-black text-emerald-600 bg-emerald-50 inline-block px-2 py-0.5 rounded-lg">
                                {err.texte_corrige}
                              </p>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-zinc-50">
                            <p className="text-sm font-medium leading-relaxed text-zinc-600">
                              {err.explication}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Improved Version */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-zinc-400 px-4">
              <CheckCircle2 size={18} className="text-emerald-600" />
              Version finale optimisée
            </h3>
            <Card className="rounded-[3rem] border-none bg-emerald-900 shadow-2xl shadow-emerald-900/20 overflow-hidden">
              <CardContent className="p-10">
                <p className="text-lg font-medium leading-relaxed text-emerald-50/80">
                  {improved}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
