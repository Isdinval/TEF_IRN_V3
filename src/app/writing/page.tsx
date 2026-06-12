"use client";

import type { CSSProperties } from "react";
import { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  BookOpen,
  Loader2,
} from "lucide-react";
import { WritingFeedback, WritingExercise } from "@/types/writing";
import { ZoneRedaction } from "./components/ZoneRedaction";
import { FeedbackIA } from "./components/FeedbackIA";
import { WritingTimer } from "./components/WritingTimer";

const fallbackExercise: WritingExercise = {
  instructions: "Rédigez un court message pour expliquer pourquoi vous souhaitez apprendre le français et vivre en France. (Section A)",
  level: "B1",
  content: { min_words: 100 },
};

function WritingCoachContent() {
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [activeErrorIndex, setActiveErrorIndex] = useState<number | null>(null);
  const [exercise, setExercise] = useState<WritingExercise>(fallbackExercise);
  const [loading, setLoading] = useState(true);
  const [leftWidth, setLeftWidth] = useState(58);

  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchData() {
      const exerciseId = searchParams.get('id');

      let query = supabase
        .from("exercises")
        .select("*")
        .eq("type", "ecrit");

      if (exerciseId) {
        query = query.eq("id", exerciseId);
      }

      const { data: exerciseData } = await query
        .limit(1)
        .maybeSingle();

      if (exerciseData) {
        setExercise({
          id: exerciseData.id,
          instructions: exerciseData.instructions || fallbackExercise.instructions,
          level: exerciseData.level || fallbackExercise.level,
          content: exerciseData.content || fallbackExercise.content,
        });
      }
      setLoading(false);
    }
    fetchData();
  }, [searchParams, supabase]);

  const handleCorrection = useCallback(async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/writing/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, instructions: exercise.instructions }),
      });
      const data = await response.json();
      setFeedback(data);
    } catch (error) {
      console.error("Correction error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [text, exercise.instructions]);

  const handleResize = useCallback((e: MouseEvent) => {
    const newWidth = (e.clientX / window.innerWidth) * 100;
    if (newWidth > 30 && newWidth < 80) {
      setLeftWidth(newWidth);
    }
  }, []);

  const stopResize = useCallback(() => {
    window.removeEventListener("mousemove", handleResize);
    window.removeEventListener("mouseup", stopResize);
  }, [handleResize]);

  const startResize = useCallback(() => {
    window.addEventListener("mousemove", handleResize);
    window.addEventListener("mouseup", stopResize);
  }, [handleResize, stopResize]);

  const wordCount = useMemo(() => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }, [text]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-slate-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="flex h-full relative">
        {/* Left Side: Writing Zone */}
        <div
          className="h-full flex flex-col overflow-hidden transition-[width] duration-75 ease-out"
          style={{ width: `${leftWidth}%` }}
        >
          <header className="p-4 border-b bg-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-slate-800 tracking-tight">Coach d'Expression Écrite</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-indigo-100 bg-indigo-50/50">
                    Niveau {exercise.level}
                  </Badge>
                </div>
              </div>
            </div>

            <WritingTimer instructions={exercise.instructions} />
          </header>

          <main className="flex-1 overflow-hidden p-6 lg:p-8 bg-[#FAFAFA]">
            <div className="max-w-3xl mx-auto h-full flex flex-col gap-6">
              <Card className="p-5 border-indigo-100 shadow-sm bg-white shrink-0">
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Sujet à traiter</h3>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {exercise.instructions}
                </p>
              </Card>

              <ZoneRedaction
                text={text}
                setText={setText}
                onAnalyze={handleCorrection}
                onReset={() => { setText(""); setFeedback(null); }}
                onSelectError={(idx) => setActiveErrorIndex(idx)}
                isAnalyzing={isAnalyzing}
                feedback={feedback}
                activeErrorIndex={activeErrorIndex}
                wordCount={wordCount}
              />
            </div>
          </main>
        </div>

        {/* Resizer */}
        <div
          className="w-1 bg-slate-200 hover:bg-indigo-400 cursor-col-resize transition-colors relative z-20"
          onMouseDown={startResize}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-12 bg-white border rounded-full flex items-center justify-center shadow-sm pointer-events-none">
            <div className="w-0.5 h-4 bg-slate-300 rounded-full mx-0.5" />
            <div className="w-0.5 h-4 bg-slate-300 rounded-full mx-0.5" />
          </div>
        </div>

        {/* Right Side: Feedback Zone */}
        <div
          className="h-full bg-[#111827] relative"
          style={{ width: `${100 - leftWidth}%` }}
        >
          <FeedbackIA
            feedback={feedback}
            activeErrorIndex={activeErrorIndex}
            onSelectError={setActiveErrorIndex}
          />
        </div>
      </div>
    </div>
  );
}

export default function WritingCoach() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[100dvh] bg-slate-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    }>
      <WritingCoachContent />
    </Suspense>
  );
}
