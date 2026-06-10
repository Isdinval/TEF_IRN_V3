"use client";

import type { CSSProperties } from "react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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

export default function WritingCoach() {
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [activeErrorIndex, setActiveErrorIndex] = useState<number | null>(null);
  const [exercise, setExercise] = useState<WritingExercise>(fallbackExercise);
  const [loading, setLoading] = useState(true);
  const [leftWidth, setLeftWidth] = useState(58);
  const [lessons, setLessons] = useState<any[]>([]);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const { data: exerciseData } = await supabase
        .from("exercises")
        .select("*")
        .eq("type", "ecrit")
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

      const { data: lessonsData } = await supabase
        .from("lessons")
        .select("id, title, category");

      if (lessonsData) {
        setLessons(lessonsData);
      }

      setLoading(false);
    }

    fetchData();
  }, [supabase]);

  const minWords = exercise.content?.min_words || 100;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const completion = Math.min((wordCount / minWords) * 100, 100);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setActiveErrorIndex(null);
    try {
      const response = await fetch("/api/writing/correct", {
        method: "POST",
        body: JSON.stringify({
          text,
          subject: exercise.instructions,
          targetLevel: exercise.level,
        }),
        headers: { "Content-Type": "application/json" },
      });
      const data = (await response.json()) as WritingFeedback;

      if (data.error) {
        console.error("API Error:", data.error);
      } else {
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
              score: data.score_global,
              answers: { text, feedback: data },
            }),
          });
        }
      }
    } catch (error) {
      console.error("Analyse error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setFeedback(null);
    setActiveErrorIndex(null);
  };

  const handleSelectError = useCallback((index: number) => {
    setActiveErrorIndex(index);
  }, []);

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
    <div className="h-screen bg-zinc-50/50 selection:bg-indigo-100 flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col mx-auto w-full max-w-[1600px] p-6 lg:px-10 lg:py-8 overflow-hidden">

        {/* Header Section */}
        <header className="shrink-0 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <Badge className="mb-4 rounded-full border-none bg-indigo-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
                Atelier rédaction TEF IRN
              </Badge>
              <h1 className="mb-2 text-4xl lg:text-5xl font-black tracking-tighter text-zinc-900 leading-none">
                COACH D'EXPRESSION <span className="text-indigo-600">ÉCRITE</span>
              </h1>
              <p className="max-w-2xl text-base lg:text-lg font-medium leading-relaxed text-zinc-500">
                Rédigez votre réponse, lancez l'analyse IA et corrigez vos formulations.
              </p>
            </div>

            <div className="w-full lg:w-80">
              <WritingTimer exerciseId={exercise.id} instructions={exercise.instructions} />
            </div>
          </div>
        </header>

        {/* Instructions Card */}
        <Card className="shrink-0 rounded-[2rem] border-none bg-white p-6 shadow-xl shadow-zinc-200/50 mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <BookOpen size={24} />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-zinc-400">Sujet de l'exercice</p>
                <p className="text-sm font-bold leading-relaxed text-zinc-700">{exercise.instructions}</p>
              </div>
            </div>
            <div className="min-w-48 space-y-2">
              <div className="flex justify-end">
                <Badge variant="outline" className="rounded-full border-zinc-200 bg-zinc-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  {wordCount}/{minWords} mots
                </Badge>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    completion >= 100 ? "bg-emerald-500" : "bg-indigo-600"
                  }`}
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden pb-4">
          <div
            style={{ "--left-width": `${leftWidth}%` } as CSSProperties}
            className="flex flex-col h-full transition-all duration-300 lg:w-[var(--left-width)] lg:min-w-[35%] lg:max-w-[75%]"
          >
            <ZoneRedaction
              text={text}
              setText={setText}
              isAnalyzing={isAnalyzing}
              feedback={feedback}
              activeErrorIndex={activeErrorIndex}
              onAnalyze={handleAnalyze}
              onReset={reset}
              onSelectError={handleSelectError}
              wordCount={wordCount}
            />
          </div>

          <div className="hidden w-2 cursor-col-resize items-center justify-center self-stretch lg:flex group relative" title="Ajuster la largeur">
            <div className="h-12 w-1 rounded-full bg-zinc-200 transition-colors group-hover:bg-indigo-300" />
            <input
              type="range"
              min="35"
              max="70"
              value={leftWidth}
              onChange={(event) => setLeftWidth(parseInt(event.target.value, 10))}
              className="absolute h-full w-8 cursor-col-resize opacity-0 z-10"
            />
          </div>

          <div
            style={{ "--right-width": `${100 - leftWidth}%` } as CSSProperties}
            className="flex flex-col h-full transition-all duration-300 lg:w-[var(--right-width)] lg:min-w-[25%]"
          >
            <FeedbackIA
              feedback={feedback}
              activeErrorIndex={activeErrorIndex}
              onSelectError={handleSelectError}
              lessons={lessons}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
