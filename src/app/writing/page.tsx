"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Send,
  CheckCircle,
  AlertCircle,
  Sparkles,
  PenTool,
  RotateCcw,
  Target,
  ChevronRight,
  Info,
  Quote
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FeedbackAnnotation {
  original_fragment: string;
  correction: string;
  explanation: string;
  type: "error" | "improvement";
}

interface AnalysisFeedback {
  score: number;
  level: string;
  comment: string;
  annotations: FeedbackAnnotation[];
  improved: string;
}

export default function WritingCoach() {
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<AnalysisFeedback | null>(null);
  const [activeAnnotationIndex, setActiveAnnotationIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleAnalyze = async () => {
    if (wordCount < 5) return;
    setIsAnalyzing(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: JSON.stringify({
          text,
          subject: "Sujet : Vous avez reçu une invitation à un mariage. Écrivez une réponse pour confirmer votre présence et poser une question sur le logement (100-120 mots).",
          targetLevel: "B2"
        }),
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      setFeedback(data);

      // Save to Supabase for History
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('exercise_attempts').insert({
          user_id: user.id,
          score: data.score,
          is_completed: true,
          answers: { text, feedback: data },
          created_at: new Date().toISOString()
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

  return (
    <div className="flex flex-col h-screen bg-slate-50 selection:bg-indigo-100 shrink-0">
      <header className="p-6 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
            <PenTool size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">Coach d'Expression Écrite</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase py-0 px-2 border-slate-200">TEF IRN • Section B</Badge>
              <span className="text-slate-400 text-xs font-medium">• 100-120 mots</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {feedback && (
            <Button variant="ghost" size="sm" onClick={reset} className="text-slate-500 font-bold hover:bg-slate-50 rounded-xl">
              <RotateCcw size={16} className="mr-2" /> Recommencer
            </Button>
          )}
          <div className={`text-sm font-bold ${wordCount < 100 ? 'text-orange-500' : 'text-green-600'}`}>
            {wordCount} mots
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-6 gap-6">
        <Card className="flex-1 flex flex-col rounded-[2rem] border-slate-100 shadow-sm overflow-hidden relative">
          <CardHeader className="bg-slate-50/50 py-3 px-6 border-b border-slate-100 shrink-0">
             <div className="flex justify-between items-center">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Zone de rédaction</p>
               {feedback && <Badge className="bg-green-100 text-green-700 border-none font-black text-[9px]">ANALYSE DISPONIBLE</Badge>}
             </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 relative">
            <AnimatePresence mode="wait">
              {!feedback ? (
                <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                  <Textarea
                    placeholder="Écrivez votre réponse ici..."
                    className="w-full h-full border-0 focus-visible:ring-0 resize-none p-8 text-lg leading-relaxed font-medium bg-transparent"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </motion.div>
              ) : (
                <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full p-8 text-lg leading-relaxed font-medium overflow-auto bg-white">
                  <div className="whitespace-pre-wrap">{highlightedText}</div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xs px-6">
               {!feedback && (
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || wordCount < 10}
                    className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-2xl shadow-2xl shadow-zinc-200 active:scale-95 transition-all"
                  >
                    {isAnalyzing ? <><Loader2 className="mr-2 animate-spin" size={20} /> Analyse...</> : <><Sparkles className="mr-2" size={20} /> Lancer l'analyse</>}
                  </Button>
               )}
            </div>
          </CardContent>
        </Card>

        <Card className="w-full lg:w-[400px] flex flex-col rounded-[2.5rem] border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden shrink-0">
          <CardHeader className="bg-zinc-900 text-white py-6 px-8 shrink-0">
             <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                   <Sparkles size={20} className="text-indigo-400" /> Feedback IA
                </CardTitle>
             </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
            {feedback ? (
              <ScrollArea className="flex-1 p-6 lg:p-8" ref={scrollContainerRef}>
                <div className="space-y-8 pb-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
                      <p className="text-[10px] font-black uppercase text-indigo-400 mb-1">Score</p>
                      <p className="text-3xl font-black text-indigo-900">{feedback.score}</p>
                    </div>
                    <div className="p-5 bg-green-50 rounded-2xl border border-green-100 text-center">
                      <p className="text-[10px] font-black uppercase text-green-500 mb-1">Niveau</p>
                      <p className="text-3xl font-black text-green-900">{feedback.level}</p>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 italic text-sm font-medium text-slate-600 leading-relaxed relative">
                    <Quote className="absolute -top-3 left-4 text-slate-200" size={24} fill="currentColor" />
                    "{feedback.comment}"
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Target size={14} /> Corrections</h3>
                    {feedback.annotations.map((ann, i) => (
                      <motion.div
                        key={i}
                        onHoverStart={() => setActiveAnnotationIndex(i)}
                        onClick={() => setActiveAnnotationIndex(i)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          activeAnnotationIndex === i ? "border-indigo-600 bg-indigo-50/50 shadow-md" : "border-slate-50 bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 shrink-0 ${ann.type === "error" ? "text-red-500" : "text-amber-500"}`}>
                            {ann.type === "error" ? <AlertCircle size={16} /> : <Info size={16} />}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm"><span className="line-through text-slate-400 mr-2">{ann.original_fragment}</span><span className="font-bold text-green-600 underline decoration-2">{ann.correction}</span></p>
                            <p className="text-xs text-slate-500 font-medium">{ann.explanation}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6 shrink-0">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center relative">
                   <PenTool className="text-slate-300" size={40} />
                </div>
                <h3 className="font-bold text-zinc-900">En attente de rédaction</h3>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
