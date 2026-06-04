"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PenTool,
  Sparkles,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  Quote,
  Target,
  ChevronRight,
  BookOpen,
  Split
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WritingCoach() {
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [activeAnnotationIndex, setActiveAnnotationIndex] = useState<number | null>(null);
  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leftWidth, setLeftWidth] = useState(60); // Percentage

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchExercise() {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('type', 'ecrit')
        .limit(1)
        .single();

      if (data) setExercise(data);
      setLoading(false);
    }
    fetchExercise();
  }, [supabase]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ text, type: "writing", exerciseId: exercise?.id }),
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      setFeedback(data);

      // Enregistrer via l'API pour créditer l'XP et l'historique
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetch('/api/exercise-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exerciseId: exercise?.id,
            score: data.score,
            answers: { text, feedback: data }
          })
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
    if (!feedback || !feedback.annotations) return text;
    let result: (string | JSX.Element)[] = [text];
    const sortedAnnotations = [...feedback.annotations].sort((a, b) => b.original_fragment.length - a.original_fragment.length);

    sortedAnnotations.forEach((ann, idx) => {
      const newResult: (string | JSX.Element)[] = [];
      result.forEach((part) => {
        if (typeof part !== "string") {
          newResult.push(part);
          return;
        }

        const fragments = part.split(ann.original_fragment);
        fragments.forEach((fragment, fIdx) => {
          newResult.push(fragment);
          if (fIdx < fragments.length - 1) {
            newResult.push(
              <motion.span
                key={`${idx}-${fIdx}`}
                whileHover={{ scale: 1.02 }}
                onClick={() => setActiveAnnotationIndex(idx)}
                className={`cursor-pointer px-0.5 rounded-sm transition-colors border-b-2 ${
                  activeAnnotationIndex === idx
                    ? "bg-indigo-200 border-indigo-600"
                    : ann.type === "error"
                      ? "bg-red-100 border-red-400 hover:bg-red-200"
                      : "bg-amber-100 border-amber-400 hover:bg-amber-200"
                }`}
              >
                {ann.original_fragment}
              </motion.span>
            );
          }
        });
      });
      result = newResult;
    });

    return result;
  }, [text, feedback, activeAnnotationIndex]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-50">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-50/50 selection:bg-indigo-100 overflow-hidden">
      <header className="p-6 bg-white border-b border-zinc-100 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-zinc-900 rounded-xl text-white shadow-xl shadow-zinc-200">
            <PenTool size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-zinc-900 uppercase">Coach d'Expression Écrite</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase py-0 px-2 border-zinc-200 bg-zinc-50 text-zinc-500">
                TEF IRN • {exercise?.level || 'B2'}
              </Badge>
              <span className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">• {exercise?.content?.min_words || 100} mots min.</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <div className={`text-xs font-black uppercase tracking-widest ${wordCount < (exercise?.content?.min_words || 100) ? 'text-orange-500' : 'text-emerald-600'}`}>
              {wordCount} mots
            </div>
            <div className="h-1 w-24 bg-zinc-100 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-zinc-900 transition-all duration-500"
                style={{ width: `${Math.min((wordCount / (exercise?.content?.min_words || 100)) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {feedback && (
              <Button variant="ghost" size="sm" onClick={reset} className="text-zinc-500 font-bold hover:bg-zinc-100 rounded-xl px-4">
                <RotateCcw size={16} className="mr-2" /> Recommencer
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="text-zinc-900 border-zinc-200 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-zinc-50"
            >
              Quitter
            </Button>
          </div>
        </div>
      </header>

      {/* Exercise Subject Bar */}
      <div className="px-6 py-4 bg-indigo-600 text-white flex items-center gap-4 shrink-0 shadow-lg shadow-indigo-100/50">
        <div className="p-1.5 bg-white/20 rounded-lg">
          <BookOpen size={16} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Sujet de l'exercice</p>
          <p className="text-sm font-bold truncate">{exercise?.instructions || "Instructions non disponibles."}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-6 gap-2">

        {/* Left Panel: Writing Area */}
        <div style={{ width: `${leftWidth}%` }} className="flex flex-col transition-all duration-300 min-w-[30%] max-w-[80%]">
          <Card className="flex-1 flex flex-col rounded-[2.5rem] border-zinc-100 shadow-xl shadow-zinc-200/50 bg-white overflow-hidden relative">
            <CardHeader className="bg-zinc-50 py-3 px-8 border-b border-zinc-100 shrink-0 flex flex-row items-center justify-between">
               <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Zone de rédaction</p>
               {feedback && <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-[9px] uppercase tracking-widest">ANALYSE PRÊTE</Badge>}
            </CardHeader>
            <CardContent className="flex-1 p-0 relative overflow-hidden">
              <AnimatePresence mode="wait">
                {!feedback ? (
                  <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                    <Textarea
                      placeholder="Débutez votre rédaction ici..."
                      className="w-full h-full border-0 focus-visible:ring-0 resize-none p-10 text-xl leading-relaxed font-medium bg-transparent text-zinc-800"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                    />
                  </motion.div>
                ) : (
                  <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full p-10 text-xl leading-relaxed font-medium overflow-auto bg-white text-zinc-800">
                    <div className="whitespace-pre-wrap">{highlightedText}</div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xs px-6">
                 {!feedback && (
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || wordCount < 5}
                      className="w-full h-16 bg-zinc-900 hover:bg-zinc-800 text-white font-black text-lg rounded-2xl shadow-2xl shadow-zinc-300 active:scale-95 transition-all"
                    >
                      {isAnalyzing ? <><Loader2 className="mr-2 animate-spin" size={24} /> ANALYSE...</> : <><Sparkles className="mr-2" size={24} /> LANCER L'ANALYSE</>}
                    </Button>
                 )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resizer Handle */}
        <div className="hidden lg:flex items-center justify-center w-6 cursor-col-resize group self-stretch" title="Ajuster la largeur">
           <div className="w-1.5 h-12 bg-zinc-200 rounded-full group-hover:bg-indigo-400 transition-colors" />
           <input
             type="range"
             min="30"
             max="80"
             value={leftWidth}
             onChange={(e) => setLeftWidth(parseInt(e.target.value))}
             className="absolute opacity-0 w-6 h-full cursor-col-resize"
           />
        </div>

        {/* Right Panel: Feedback Area */}
        <div style={{ width: `${100 - leftWidth}%` }} className="flex flex-col transition-all duration-300 min-w-[20%]">
          <Card className="flex-1 flex flex-col rounded-[2.5rem] border-zinc-100 shadow-2xl shadow-indigo-100/50 bg-white overflow-hidden shrink-0">
            <CardHeader className="bg-zinc-900 text-white py-6 px-8 shrink-0">
               <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-black flex items-center gap-2 uppercase tracking-tighter">
                     <Sparkles size={20} className="text-indigo-400" /> Feedback IA
                  </CardTitle>
               </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
              {feedback ? (
                <ScrollArea className="flex-1">
                  <div className="p-8 space-y-8 pb-10">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 text-center">
                        <p className="text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-widest">Score</p>
                        <p className="text-4xl font-black text-indigo-900">{feedback.score}<span className="text-lg opacity-40">/100</span></p>
                      </div>
                      <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 text-center">
                        <p className="text-[10px] font-black uppercase text-emerald-500 mb-1 tracking-widest">Niveau</p>
                        <p className="text-4xl font-black text-emerald-900">{feedback.level}</p>
                      </div>
                    </div>

                    <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 italic text-sm font-medium text-zinc-600 leading-relaxed relative">
                      <Quote className="absolute -top-3 left-6 text-zinc-200" size={24} fill="currentColor" />
                      "{feedback.comment}"
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                          <Target size={14} className="text-indigo-600" /> Corrections Détaillées
                        </h3>
                        <Badge variant="outline" className="text-[9px] font-black">{feedback.annotations?.length || 0} points</Badge>
                      </div>

                      <div className="space-y-3">
                        {feedback.annotations.map((ann: any, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            onHoverStart={() => setActiveAnnotationIndex(i)}
                            onClick={() => setActiveAnnotationIndex(i)}
                            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                              activeAnnotationIndex === i
                                ? "border-indigo-600 bg-indigo-50/30 shadow-lg scale-[1.02]"
                                : "border-zinc-50 bg-zinc-50/50 hover:border-zinc-100"
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`mt-1.5 shrink-0 ${ann.type === "error" ? "text-rose-500" : "text-amber-500"}`}>
                                {ann.type === "error" ? <AlertCircle size={20} /> : <Info size={20} />}
                              </div>
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="line-through text-zinc-400 text-sm font-medium">{ann.original_fragment}</span>
                                  <ChevronRight size={12} className="text-zinc-300" />
                                  <span className="font-black text-emerald-600 underline decoration-2 underline-offset-4 text-base italic">{ann.correction}</span>
                                </div>
                                <p className="text-xs text-zinc-500 font-bold leading-relaxed">{ann.explanation}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
                  <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center relative overflow-hidden">
                     <PenTool className="text-zinc-200" size={40} />
                     <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 to-transparent" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-black text-zinc-900 uppercase tracking-tight">En attente de rédaction</h3>
                    <p className="text-xs text-zinc-400 font-medium max-w-[200px] mx-auto leading-relaxed italic">
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
  );
}
