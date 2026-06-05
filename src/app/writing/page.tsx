"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Info,
  Loader2,
  PenTool,
  Quote,
  RotateCcw,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface WritingAnnotation {
  type: "error" | "suggestion" | string;
  original_fragment: string;
  correction: string;
  explanation: string;
}

interface WritingFeedback {
  score: number;
  level: string;
  comment: string;
  annotations?: WritingAnnotation[];
}

interface WritingExercise {
  id?: string;
  instructions: string;
  level: string;
  content?: {
    min_words?: number;
  };
}

const fallbackExercise: WritingExercise = {
  instructions: "Rédigez un court message pour expliquer pourquoi vous souhaitez apprendre le français et vivre en France.",
  level: "B1",
  content: { min_words: 100 },
};

export default function WritingCoach() {
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [activeAnnotationIndex, setActiveAnnotationIndex] = useState<number | null>(null);
  const [exercise, setExercise] = useState<WritingExercise>(fallbackExercise);
  const [loading, setLoading] = useState(true);
  const [leftWidth, setLeftWidth] = useState(58);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchExercise() {
      const { data } = await supabase
        .from("exercises")
        .select("*")
        .eq("type", "ecrit")
        .limit(1)
        .maybeSingle();

      if (data) {
        setExercise({
          id: data.id,
          instructions: data.instructions || fallbackExercise.instructions,
          level: data.level || fallbackExercise.level,
          content: data.content || fallbackExercise.content,
        });
      }

      setLoading(false);
    }

    fetchExercise();
  }, [supabase]);

  const minWords = exercise.content?.min_words || 100;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const completion = Math.min((wordCount / minWords) * 100, 100);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: JSON.stringify({
          text,
          type: "writing",
          exerciseId: exercise.id,
          subject: exercise.instructions,
          targetLevel: exercise.level,
        }),
        headers: { "Content-Type": "application/json" },
      });
      const data = (await response.json()) as WritingFeedback;
      setFeedback(data);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await fetch("/api/exercise-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exerciseId: exercise.id,
            score: data.score,
            answers: { text, feedback: data },
          }),
        });
      }
    } catch (error) {
      console.error("Analyse error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setFeedback(null);
    setActiveAnnotationIndex(null);
  };

  const highlightedText = useMemo(() => {
    if (!feedback?.annotations) return text;

    let result: (string | JSX.Element)[] = [text];
    const sortedAnnotations = [...feedback.annotations].sort(
      (a, b) => b.original_fragment.length - a.original_fragment.length
    );

    sortedAnnotations.forEach((annotation, annotationIndex) => {
      const newResult: (string | JSX.Element)[] = [];

      result.forEach((part) => {
        if (typeof part !== "string") {
          newResult.push(part);
          return;
        }

        const fragments = part.split(annotation.original_fragment);
        fragments.forEach((fragment, fragmentIndex) => {
          newResult.push(fragment);
          if (fragmentIndex < fragments.length - 1) {
            newResult.push(
              <motion.span
                key={`${annotationIndex}-${fragmentIndex}`}
                whileHover={{ scale: 1.02 }}
                onClick={() => setActiveAnnotationIndex(annotationIndex)}
                className={`cursor-pointer rounded-sm border-b-2 px-0.5 transition-colors ${
                  activeAnnotationIndex === annotationIndex
                    ? "border-indigo-600 bg-indigo-200"
                    : annotation.type === "error"
                      ? "border-rose-400 bg-rose-100 hover:bg-rose-200"
                      : "border-amber-400 bg-amber-100 hover:bg-amber-200"
                }`}
              >
                {annotation.original_fragment}
              </motion.span>
            );
          }
        });
      });

      result = newResult;
    });

    return result;
  }, [activeAnnotationIndex, feedback, text]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50">
        <Loader2 className="mb-4 animate-spin text-indigo-600" size={44} />
        <p className="animate-pulse text-sm font-black uppercase tracking-widest text-zinc-400">
          Préparation de l'atelier d'écriture...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 selection:bg-indigo-100">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 p-6 pt-10 lg:p-10">
        <header className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Badge className="mb-4 rounded-full border-none bg-indigo-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
              Atelier rédaction TEF IRN
            </Badge>
            <h1 className="mb-4 text-5xl font-black tracking-tighter text-zinc-900">
              COACH D'EXPRESSION <span className="text-indigo-600">ÉCRITE</span>
            </h1>
            <p className="max-w-2xl text-lg font-medium leading-relaxed text-zinc-500">
              Rédigez votre réponse, lancez l'analyse IA et corrigez vos formulations comme dans les ateliers premium de Maitris.
            </p>
          </div>

          <Card className="rounded-[2.5rem] border-none bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white shadow-2xl shadow-indigo-100">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <Wand2 size={28} />
            </div>
            <h2 className="mb-2 text-2xl font-black tracking-tight">Analyse guidée</h2>
            <p className="mb-8 text-sm font-medium leading-relaxed text-indigo-100">
              Objectif : respecter le sujet, enrichir les phrases et viser le niveau {exercise.level}.
            </p>
            <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-md">
              <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-indigo-100">
                <span>Progression</span>
                <span>{wordCount}/{minWords} mots</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${completion}%` }} />
              </div>
            </div>
          </Card>
        </header>

        <Card className="rounded-[2rem] border-none bg-white p-6 shadow-xl shadow-zinc-200/50">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <BookOpen size={24} />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-zinc-400">Sujet de l'exercice</p>
                <p className="text-sm font-bold leading-relaxed text-zinc-700">{exercise.instructions}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Badge variant="outline" className="rounded-full border-zinc-200 bg-zinc-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Niveau {exercise.level}
              </Badge>
              <Badge variant="outline" className="rounded-full border-zinc-200 bg-zinc-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                {minWords} mots min.
              </Badge>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-4 lg:flex-row">
          <div
            style={{ "--left-width": `${leftWidth}%` } as CSSProperties}
            className="flex w-full flex-col transition-all duration-300 lg:w-[var(--left-width)] lg:min-w-[30%] lg:max-w-[80%]"
          >
            <Card className="flex min-h-[680px] flex-1 flex-col overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl shadow-zinc-200/50">
              <CardHeader className="flex shrink-0 flex-row items-center justify-between border-b border-zinc-100 bg-zinc-50 px-8 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xl shadow-zinc-200">
                    <PenTool size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black uppercase tracking-tight text-zinc-900">Zone de rédaction</CardTitle>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Votre texte reste modifiable avant analyse</p>
                  </div>
                </div>
                {feedback && (
                  <Badge className="border-none bg-emerald-100 text-[9px] font-black uppercase tracking-widest text-emerald-700">
                    Analyse prête
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
                        onChange={(event) => setText(event.target.value)}
                      />
                    </motion.div>
                  ) : (
                    <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full overflow-auto bg-white p-10 text-xl font-medium leading-relaxed text-zinc-800">
                      <div className="whitespace-pre-wrap">{highlightedText}</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="absolute bottom-8 left-1/2 w-full max-w-sm -translate-x-1/2 px-6">
                  {!feedback ? (
                    <Button
                      onClick={handleAnalyze}
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
                    <Button onClick={reset} className="h-14 w-full rounded-2xl bg-white font-black text-zinc-900 shadow-xl shadow-zinc-200 hover:bg-zinc-50">
                      <RotateCcw size={18} className="mr-2" /> Retravailler mon texte
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="hidden w-6 cursor-col-resize items-center justify-center self-stretch lg:flex" title="Ajuster la largeur">
            <div className="h-12 w-1.5 rounded-full bg-zinc-200 transition-colors group-hover:bg-indigo-400" />
            <input
              type="range"
              min="35"
              max="70"
              value={leftWidth}
              onChange={(event) => setLeftWidth(parseInt(event.target.value, 10))}
              className="absolute h-full w-6 cursor-col-resize opacity-0"
            />
          </div>

          <div
            style={{ "--right-width": `${100 - leftWidth}%` } as CSSProperties}
            className="flex w-full flex-col transition-all duration-300 lg:w-[var(--right-width)] lg:min-w-[25%]"
          >
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
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-[2rem] border border-indigo-100 bg-indigo-50 p-6 text-center">
                          <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-indigo-400">Score</p>
                          <p className="text-4xl font-black text-indigo-900">
                            {feedback.score}<span className="text-lg opacity-40">/100</span>
                          </p>
                        </div>
                        <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-6 text-center">
                          <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-emerald-500">Niveau</p>
                          <p className="text-4xl font-black text-emerald-900">{feedback.level}</p>
                        </div>
                      </div>

                      <div className="relative rounded-[2rem] border border-zinc-100 bg-zinc-50 p-6 text-sm font-medium italic leading-relaxed text-zinc-600">
                        <Quote className="absolute -top-3 left-6 text-zinc-200" size={24} fill="currentColor" />
                        “{feedback.comment}”
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                          <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                            <Target size={14} className="text-indigo-600" /> Corrections détaillées
                          </h3>
                          <Badge variant="outline" className="text-[9px] font-black">
                            {feedback.annotations?.length || 0} points
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          {feedback.annotations?.map((annotation, index) => (
                            <motion.div
                              key={`${annotation.original_fragment}-${index}`}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              onHoverStart={() => setActiveAnnotationIndex(index)}
                              onClick={() => setActiveAnnotationIndex(index)}
                              className={`cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                                activeAnnotationIndex === index
                                  ? "scale-[1.02] border-indigo-600 bg-indigo-50/30 shadow-lg"
                                  : "border-zinc-50 bg-zinc-50/50 hover:border-zinc-100"
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <div className={`mt-1.5 shrink-0 ${annotation.type === "error" ? "text-rose-500" : "text-amber-500"}`}>
                                  {annotation.type === "error" ? <AlertCircle size={20} /> : <Info size={20} />}
                                </div>
                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium text-zinc-400 line-through">{annotation.original_fragment}</span>
                                    <ChevronRight size={12} className="text-zinc-300" />
                                    <span className="text-base font-black italic text-emerald-600 underline decoration-2 underline-offset-4">{annotation.correction}</span>
                                  </div>
                                  <p className="text-xs font-bold leading-relaxed text-zinc-500">{annotation.explanation}</p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
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
          </div>
        </div>
      </div>
    </div>
  );
}
