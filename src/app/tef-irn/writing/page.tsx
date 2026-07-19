"use client";

import type { CSSProperties } from "react";
import { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {"use client";

import type { CSSProperties } from "react";
import { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  BookOpen,
  Loader2,
  ChevronLeft
} from "lucide-react";
import { WritingFeedback, WritingExercise } from "@/types/writing";
import { ZoneRedaction } from "./components/ZoneRedaction";
import { FeedbackIA } from "./components/FeedbackIA";
import { WritingTimer } from "./components/WritingTimer";
import { WritingScenarioCatalogue, WritingScenarioListItem, Section, Level } from "./components/WritingScenarioCatalogue";
import { useParcours } from "@/contexts/ParcoursContext";
import { useCoachContext } from "@/contexts/CoachContext";

const fallbackExercise: WritingExercise = {
  instructions: "Rédigez un court message pour expliquer pourquoi vous souhaitez apprendre le français et vivre en France. (Section A)",
  level: "B1",
  content: { min_words: 100 },
};

type Status = "catalogue" | "writing";

export function WritingCoachContent() {
  const params = useParams();
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [activeErrorIndex, setActiveErrorIndex] = useState<number | null>(null);
  const [exercise, setExercise] = useState<WritingExercise>(fallbackExercise);
  const [loading, setLoading] = useState(true);
  const [leftWidth, setLeftWidth] = useState(58);
  const [status, setStatus] = useState<Status>("catalogue");
  const [durationSeconds, setDurationSeconds] = useState<number | undefined>(undefined);

  const [allScenarios, setAllScenarios] = useState<WritingScenarioListItem[]>([]);
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  const [filterSection, setFilterSection] = useState<Section | "all">("all");
  const [filterLevel, setFilterLevel] = useState<Level | "all">("all");
  const [filterTypeTexte, setFilterTypeTexte] = useState<string | "all">("all");

  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeParcours } = useParcours();
  const { setPageContext } = useCoachContext();

  useEffect(() => {
    if (loading || status !== "writing") return;
    setPageContext({ type: "writing", instructions: exercise.instructions, level: exercise.level });
    return () => setPageContext(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, status, exercise.instructions, exercise.level]);

  // Charge le catalogue de sujets (entrée libre uniquement, mais chargement léger et inoffensif dans tous les cas).
  useEffect(() => {
    fetch("/api/writing/scenarios")
      .then((r) => r.json())
      .then((data) => {
        if (data.scenarios) setAllScenarios(data.scenarios);
      })
      .catch((err) => console.error("Erreur chargement des sujets:", err))
      .finally(() => setLoadingScenarios(false));
  }, []);

  useEffect(() => {
    async function fetchData() {
      const exerciseId = (params?.id as string | undefined) || searchParams.get('id');
      const subjectParam = searchParams.get('subject');
      const levelParam = searchParams.get('level');

      if (subjectParam) {
        setExercise({
          id: exerciseId || undefined,
          instructions: subjectParam,
          level: levelParam || "B1",
          content: { min_words: 100 }
        });
        setStatus("writing");
        setLoading(false);
        return;
      }

      if (!exerciseId) {
        // Entrée libre (nav directe, sans id ni subject) : on affiche le catalogue
        // au lieu d'imposer un exercice. Les entrées parcours/correction/coach-chat
        // passent toujours un id et ne sont donc pas concernées par cette branche.
        setStatus("catalogue");
        setLoading(false);
        return;
      }

      const { data: exerciseData } = await supabase
        .from("exercises")
        .select("*")
        .eq("type", "ecrit")
        .eq("id", exerciseId)
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
      setStatus("writing");
      setLoading(false);
    }
    fetchData();
  }, [params?.id, searchParams, supabase]);

  const handleSelectScenario = useCallback((scenarioId: string) => {
    const scenario = allScenarios.find((s) => s.id === scenarioId);
    if (!scenario) return;

    setExercise({
      id: scenario.id,
      instructions: scenario.sujet,
      level: scenario.level,
      content: { min_words: scenario.min_words },
    });
    setDurationSeconds(scenario.duration_seconds);
    setText("");
    setFeedback(null);
    setActiveErrorIndex(null);
    setStatus("writing");
  }, [allScenarios]);

  const handleSurpriseMe = useCallback(() => {
    const filtered = allScenarios.filter(
      (s) =>
        (filterSection === "all" || s.section === filterSection) &&
        (filterLevel === "all" || s.level === filterLevel) &&
        (filterTypeTexte === "all" || s.type_texte === filterTypeTexte)
    );
    if (filtered.length === 0) return;
    const random = filtered[Math.floor(Math.random() * filtered.length)];
    handleSelectScenario(random.id);
  }, [allScenarios, filterSection, filterLevel, filterTypeTexte, handleSelectScenario]);

  const handleCorrection = useCallback(async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/writing/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          subject: exercise.instructions, // Pass subject for AI context
          targetLevel: exercise.level
        }),
      });
      const data = await response.json();
      setFeedback(data);

      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const completeRes = await fetch("/api/exercise-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exerciseId: exercise.id,
            score: data.score_global,
            answers: {
              text,
              subject: exercise.instructions,
              feedback: data
            },
            aiFeedback: data
          })
        });

        if (completeRes.ok) {
          router.refresh(); // Ensure the parcours page will see fresh data if navigating back
        }
      }
    } catch (error) {
      console.error("Correction error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [text, exercise, supabase, router]);

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

  if (status === "catalogue") {
    return (
      <div className="h-[100dvh] overflow-y-auto bg-zinc-50/50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
        <div className="mx-auto flex min-h-full max-w-5xl flex-col gap-8 p-6 pt-10 lg:p-10">
          <header>
            <Badge className="mb-4 rounded-full border-none bg-indigo-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
              Expression Écrite
            </Badge>
            <h1 className="mb-4 text-5xl font-black tracking-tighter text-zinc-900">
              COACH D&apos;EXPRESSION <span className="text-indigo-600">ÉCRITE</span>
            </h1>
            <p className="max-w-2xl text-lg font-medium leading-relaxed text-zinc-500">
              Choisissez un sujet dans le catalogue, ou laissez-vous surprendre.
            </p>
          </header>

          <WritingScenarioCatalogue
            scenarios={allScenarios}
            loading={loadingScenarios}
            section={filterSection}
            level={filterLevel}
            typeTexte={filterTypeTexte}
            onSectionChange={setFilterSection}
            onLevelChange={setFilterLevel}
            onTypeTexteChange={setFilterTypeTexte}
            onSelectScenario={handleSelectScenario}
            onSurpriseMe={handleSurpriseMe}
          />
        </div>
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
              <button
                onClick={() => {
                  if (activeParcours) {
                    router.push(`/tef-irn/parcours/${activeParcours.slug}`);
                  } else {
                    router.back();
                  }
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-900 mr-1"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="bg-indigo-600 p-2 rounded-lg text-white hidden sm:block">
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
  BookOpen,
  Loader2,
  ChevronLeft
} from "lucide-react";
import { WritingFeedback, WritingExercise } from "@/types/writing";
import { ZoneRedaction } from "./components/ZoneRedaction";
import { FeedbackIA } from "./components/FeedbackIA";
import { WritingTimer } from "./components/WritingTimer";
import { useParcours } from "@/contexts/ParcoursContext";
import { useCoachContext } from "@/contexts/CoachContext";

const fallbackExercise: WritingExercise = {
  instructions: "Rédigez un court message pour expliquer pourquoi vous souhaitez apprendre le français et vivre en France. (Section A)",
  level: "B1",
  content: { min_words: 100 },
};

export function WritingCoachContent() {
  const params = useParams();
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
  const { activeParcours } = useParcours();
  const { setPageContext } = useCoachContext();

  useEffect(() => {
    if (loading) return;
    setPageContext({ type: "writing", instructions: exercise.instructions, level: exercise.level });
    return () => setPageContext(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, exercise.instructions, exercise.level]);

  useEffect(() => {
    async function fetchData() {
      const exerciseId = (params?.id as string | undefined) || searchParams.get('id');
      const subjectParam = searchParams.get('subject');
      const levelParam = searchParams.get('level');

      if (subjectParam) {
        setExercise({
          id: exerciseId || undefined,
          instructions: subjectParam,
          level: levelParam || "B1",
          content: { min_words: 100 }
        });
        setLoading(false);
        return;
      }

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
  }, [params?.id, searchParams, supabase]);

  const handleCorrection = useCallback(async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/writing/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          subject: exercise.instructions, // Pass subject for AI context
          targetLevel: exercise.level
        }),
      });
      const data = await response.json();
      setFeedback(data);

      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const completeRes = await fetch("/api/exercise-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exerciseId: exercise.id,
            score: data.score_global,
            answers: {
              text,
              subject: exercise.instructions,
              feedback: data
            },
            aiFeedback: data
          })
        });

        if (completeRes.ok) {
          router.refresh(); // Ensure the parcours page will see fresh data if navigating back
        }
      }
    } catch (error) {
      console.error("Correction error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [text, exercise, supabase, router]);

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
              <button
                onClick={() => {
                  if (activeParcours) {
                    router.push(`/tef-irn/parcours/${activeParcours.slug}`);
                  } else {
                    router.back();
                  }
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-900 mr-1"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="bg-indigo-600 p-2 rounded-lg text-white hidden sm:block">
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
