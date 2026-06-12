"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  LayoutGrid,
  GraduationCap,
  Calendar,
  Brain,
  Sparkles,
  ChevronLeft,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BreadcrumbParcours } from "@/components/parcours/BreadcrumbParcours";

interface Exercise {
  id: string;
  level: string;
  instructions: string;
  category: string;
  content: {
    questions: string[];
    options: string[][];
    correct_answers: number[];
  };
}

type Mode = "selection" | "training";

function PracticeContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("selection");
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ level: "A2", category: "Grammaire" });
  const [isReviewMode, setIsReviewMode] = useState(false);

  const router = useRouter();
  const supabase = createClient();
  const parcoursId = searchParams.get("parcoursId");

  useEffect(() => {
    const lessonId = searchParams.get('lessonId');
    const topic = searchParams.get('topic');
    const level = searchParams.get('level');

    if (lessonId && topic) {
      autoStart(lessonId, topic, level || undefined);
    }
  }, [searchParams]);

  const autoStart = async (lessonId: string, topic: string, level?: string) => {
    setLoading(true);
    const { data: lessonExo } = await supabase
      .from('exercises')
      .select('*')
      .eq('lesson_id', lessonId)
      .eq('type', 'qcm_centre_entrainement')
      .limit(1)
      .maybeSingle();

    if (lessonExo) {
      setExercise(lessonExo as Exercise);
      setMode("training");
    } else {
      let targetLevel = level;
      if (!targetLevel) {
        const { data: lessonData } = await supabase
          .from('lessons')
          .select('level')
          .eq('id', lessonId)
          .single();
        targetLevel = lessonData?.level;
      }

      if (targetLevel) {
        const normalizedTopic = topic ? (topic.charAt(0).toUpperCase() + topic.slice(1).toLowerCase()) : topic;
        const { data: topicExo } = await supabase
          .from('exercises')
          .select('*')
          .eq('level', targetLevel)
          .eq('category', normalizedTopic)
          .eq('type', 'qcm_centre_entrainement')
          .limit(1)
          .maybeSingle();

        if (topicExo) {
          setExercise(topicExo as Exercise);
          setMode("training");
        }
      }
    }
    setLoading(false);
  };

  const startExercise = async (level: string, category: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .eq("level", level)
      .eq("category", category)
      .eq("type", "qcm_centre_entrainement")
      .limit(1)
      .maybeSingle();

    if (data) {
      setExercise(data as Exercise);
      setMode("training");
      setCurrentQuestionIndex(0);
      setScore(0);
      setIsFinished(false);
    }
    setLoading(false);
  };

  const handleAnswer = (index: number) => {
    if (isChecked) return;
    setSelected(index);
  };

  const checkAnswer = () => {
    if (selected === null || isChecked) return;
    setIsChecked(true);
    if (selected === exercise?.content.correct_answers[currentQuestionIndex]) {
      setScore((prev) => prev + 1);
    }
  };

  const nextQuestion = async () => {
    if (!exercise) return;
    if (currentQuestionIndex < exercise.content.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelected(null);
      setIsChecked(false);
    } else {
      await finishExercise();
    }
  };

  const finishExercise = async () => {
    if (!exercise) return;
    setLoading(true);
    const finalScore = Math.round((score / exercise.content.questions.length) * 100);

    try {
      await fetch("/api/exercise-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId: exercise.id,
          score: finalScore,
          answers: [],
        }),
      });
    } catch (e) {
      console.error(e);
    }

    setIsFinished(true);
    setLoading(false);
  };

  const reset = () => {
    setMode("selection");
    setExercise(null);
    setCurrentQuestionIndex(0);
    setSelected(null);
    setIsChecked(false);
    setScore(0);
    setIsFinished(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-bold animate-pulse">Chargement de l'exercice...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-12">
      <div className="max-w-5xl mx-auto">
        <BreadcrumbParcours currentPage="QCM" />

        {mode === "selection" ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <header className="space-y-4">
              <Badge className="bg-indigo-600 rounded-full px-4 py-1 text-xs font-black uppercase tracking-widest border-none">
                Centre d'entraînement
              </Badge>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
                PRATIQUE <span className="text-indigo-600">QCM</span>
              </h1>
              <p className="text-xl text-slate-500 font-medium max-w-2xl">
                Choisissez votre niveau et la catégorie pour commencer une session d'entraînement rapide.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-8 rounded-[2.5rem] border-none bg-white shadow-xl shadow-zinc-200/50">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Target size={20} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Configuration</h3>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Niveau CEFR</label>
                    <div className="grid grid-cols-4 gap-2">
                      {["A1", "A2", "B1", "B2"].map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setFilters({ ...filters, level: lvl })}
                          className={`py-3 rounded-xl font-black text-sm transition-all ${
                            filters.level === lvl ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Catégorie</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Grammaire", "Conjugaison", "Syntaxe", "Orthographe"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setFilters({ ...filters, category: cat })}
                          className={`py-3 px-4 rounded-xl font-black text-sm text-left transition-all ${
                            filters.category === cat ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => startExercise(filters.level, filters.category)}
                    className="w-full h-16 rounded-2xl bg-zinc-900 hover:bg-black text-white font-black text-lg shadow-xl shadow-zinc-200"
                  >
                    Lancer l'entraînement
                    <ArrowRight className="ml-2" />
                  </Button>
                </div>
              </Card>

              <div className="space-y-6">
                <Card className="p-8 rounded-[2.5rem] border-none bg-indigo-600 text-white shadow-xl shadow-indigo-200/50">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                      <GraduationCap size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-lg uppercase tracking-tight">Format Examen</h4>
                      <p className="text-indigo-100 text-sm font-medium">5 questions par session</p>
                    </div>
                  </div>
                  <p className="text-indigo-50 font-medium leading-relaxed italic">
                    "Ces exercices sont conçus pour valider rapidement vos acquis sur des points précis de la langue française."
                  </p>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-6 rounded-[2rem] border-none bg-white shadow-lg shadow-zinc-200/50 flex flex-col items-center text-center gap-2">
                    <LayoutGrid className="text-indigo-600" size={24} />
                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Questions</span>
                    <span className="text-xl font-black text-slate-900">160+ QCM</span>
                  </Card>
                  <Card className="p-6 rounded-[2rem] border-none bg-white shadow-lg shadow-zinc-200/50 flex flex-col items-center text-center gap-2">
                    <Calendar className="text-emerald-500" size={24} />
                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Révision</span>
                    <span className="text-xl font-black text-slate-900">Quotidienne</span>
                  </Card>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="max-w-3xl mx-auto py-8">
            <AnimatePresence mode="wait">
              {!isFinished ? (
                <motion.div key="training" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="space-y-8">
                  <div className="flex justify-between items-center bg-white px-8 py-6 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                    <button onClick={reset} className="flex items-center gap-2 text-zinc-400 hover:text-indigo-600 font-bold transition-colors">
                      <ChevronLeft size={20} />
                      Quitter
                    </button>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-black border-zinc-200">{filters.level}</Badge>
                      <div className="h-4 w-px bg-zinc-100" />
                      <span className="text-sm font-black text-slate-600">{currentQuestionIndex + 1} / {exercise?.content.questions.length}</span>
                    </div>
                  </div>

                  <Card className="border-none shadow-2xl shadow-zinc-200/50 bg-white rounded-[3rem] overflow-hidden">
                    <CardContent className="p-12 text-center space-y-12">
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                        <Brain size={32} />
                      </div>
                      <h3 className="text-3xl font-black text-slate-800 leading-tight">
                        {exercise?.content.questions[currentQuestionIndex]}
                      </h3>

                      <div className="grid grid-cols-1 gap-4 text-left max-w-xl mx-auto">
                        {exercise?.content.options[currentQuestionIndex].map((opt, i) => (
                          <button
                            key={i}
                            disabled={isChecked}
                            onClick={() => handleAnswer(i)}
                            className={`
                              w-full p-6 rounded-2xl border-2 transition-all font-bold text-lg flex items-center justify-between group
                              ${selected === i ? "border-indigo-600 bg-indigo-50 text-indigo-900" : "border-zinc-100 bg-white text-slate-500 hover:border-indigo-200 hover:text-indigo-600"}
                              ${isChecked && i === exercise?.content.correct_answers[currentQuestionIndex] ? "border-emerald-500 bg-emerald-50 text-emerald-900" : ""}
                              ${isChecked && selected === i && i !== exercise?.content.correct_answers[currentQuestionIndex] ? "border-rose-500 bg-rose-50 text-rose-900" : ""}
                            `}
                          >
                            <span>{opt}</span>
                            {isChecked && i === exercise?.content.correct_answers[currentQuestionIndex] && <CheckCircle2 className="text-emerald-500" />}
                            {isChecked && selected === i && i !== exercise?.content.correct_answers[currentQuestionIndex] && <XCircle className="text-rose-500" />}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-center">
                    {!isChecked ? (
                      <Button
                        disabled={selected === null}
                        onClick={checkAnswer}
                        className="px-16 h-16 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95"
                      >
                        Vérifier ma réponse
                      </Button>
                    ) : (
                      <Button
                        onClick={nextQuestion}
                        className="px-16 h-16 bg-zinc-900 hover:bg-black rounded-2xl font-black text-lg shadow-xl shadow-zinc-200 transition-all hover:scale-105 active:scale-95"
                      >
                        {currentQuestionIndex < (exercise?.content.questions.length || 0) - 1 ? "Question suivante" : "Voir mon score"}
                        <ArrowRight className="ml-2" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="result" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-12 py-12">
                  <div className="relative inline-block">
                    <div className="w-48 h-48 rounded-[3.5rem] bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto rotate-12 relative z-10 shadow-xl shadow-emerald-50">
                      <Sparkles size={80} />
                    </div>
                    <div className="absolute inset-0 bg-emerald-200 blur-3xl opacity-20 -z-10" />
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-5xl font-black text-slate-900">Session terminée !</h2>
                    <p className="text-2xl text-slate-500 font-medium italic">Excellent travail. Vous progressez rapidement.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                      <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">Score final</p>
                      <p className="text-5xl font-black text-indigo-600">{Math.round((score / (exercise?.content.questions.length || 1)) * 100)}%</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                      <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">XP Gagnés</p>
                      <p className="text-5xl font-black text-amber-500">+{score * 20}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button onClick={reset} size="lg" className="px-12 h-16 rounded-2xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 font-black text-lg">
                      Nouvel entraînement
                    </Button>
                    {parcoursId ? (
                        <Button
                          onClick={() => router.push(`/parcours/${parcoursId}`)}
                          size="lg"
                          className="px-12 h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl shadow-indigo-100"
                        >
                          Reprendre mon parcours
                        </Button>
                    ) : (
                        <Button onClick={() => router.push("/dashboard")} size="lg" className="px-12 h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl shadow-indigo-100">
                          Tableau de bord
                        </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    }>
      <PracticeContent />
    </Suspense>
  );
}
