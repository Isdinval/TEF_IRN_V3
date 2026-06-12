"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Target, Sparkles, ArrowRight, Lightbulb,
  BookOpen, GraduationCap, CheckCircle2, MessageSquare, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BreadcrumbParcours } from "@/components/parcours/BreadcrumbParcours";

// ─── helpers ────────────────────────────────────────────────────────────────

/** Strip leading emoji + space from section titles */
function stripEmoji(text: string) {
  return text.replace(/^[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/u, "").trim();
}

/**
 * Detect a mnemo string: a `strong` whose text is ALL-CAPS words
 */
function isMnemo(text: string) {
  return /^[A-Z][A-Z\s·\-]+[A-Z]$/.test(text.trim()) && text.trim().length > 4;
}

function parseMnemoLetters(text: string): string[] {
  return text.trim().split(/[\s·]+/).filter(Boolean);
}

// ─── component ──────────────────────────────────────────────────────────────

export default function LessonDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lesson, setLesson] = useState<any>(null);
  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"reading" | "quiz" | "result">("reading");
  const [readingProgress, setReadingProgress] = useState(0);

  // Quiz state
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);

  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const parcoursId = searchParams.get("parcoursId");

  useEffect(() => {
    async function fetchData() {
      const { data: lessonData } = await supabase.from('lessons').select('*').eq('id', id).single();
      if (lessonData) setLesson(lessonData);
      const { data: exoData } = await supabase.from('exercises').select('*').eq('lesson_id', id).eq('type', 'qcm').limit(1).maybeSingle();
      if (exoData) setExercise(exoData);
      setLoading(false);
    }
    fetchData();
  }, [id, supabase]);

  // Reading progress
  useEffect(() => {
    if (step !== "reading") return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const total = scrollHeight - clientHeight;
      const progress = total > 0 ? Math.min(100, (scrollTop / total) * 100) : 0;
      setReadingProgress(progress);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [step]);

  const handleNextQuestion = async () => {
    if (currentQ < (exercise?.content?.questions?.length || 0) - 1) {
      setCurrentQ(currentQ + 1);
      setSelected(null);
      setIsChecked(false);
    } else {
      setLoading(true);
      await saveResults();
      router.push(`/lessons/${id}/complete${parcoursId ? `?parcoursId=${parcoursId}` : ''}`);
    }
  };

  const handleFinishLesson = async () => {
    if (exercise) {
      setStep("quiz");
    } else {
      setLoading(true);
      await awardXpOnly();
      router.push(`/lessons/${id}/complete${parcoursId ? `?parcoursId=${parcoursId}` : ''}`);
    }
  };

  const saveResults = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const finalScore = Math.round((score / exercise.content.questions.length) * 100);

    // Save attempt
    await fetch('/api/exercise-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseId: exercise.id,
        score: finalScore,
        answers: []
      })
    });

    // Save lesson progress
    await supabase.from('lesson_progress').insert({
      user_id: user.id,
      lesson_id: id
    });
  };

  const awardXpOnly = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await fetch('/api/exercise-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseId: null,
        score: 100,
        answers: []
      })
    });

    await supabase.from('lesson_progress').insert({
      user_id: user.id,
      lesson_id: id
    });
  };

  if (loading || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
          <p className="font-bold text-slate-500 animate-pulse">Chargement de la leçon...</p>
        </div>
      </div>
    );
  }

  // Pre-process markdown for a "cleaner" view
  const cleanContent = lesson.content;

  const markdownComponents = {
    h2: ({ children, ...props }: any) => {
      const text = String(children);
      const label = stripEmoji(text);
      let icon = <BookOpen className="text-indigo-500" size={24} />;
      if (text.toLowerCase().includes("objectif")) icon = <Target className="text-amber-500" size={24} />;
      if (text.toLowerCase().includes("exemple")) icon = <Sparkles className="text-emerald-500" size={24} />;
      if (text.toLowerCase().includes("astuce")) icon = <Lightbulb className="text-violet-500" size={24} />;

      return (
        <div className="mt-16 mb-8 group">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              {icon}
            </div>
            <h2 {...props} className="text-2xl font-black text-slate-800 m-0 tracking-tight uppercase">
              {label}
            </h2>
          </div>
          <div className="h-1 w-20 bg-indigo-500 rounded-full" />
        </div>
      );
    },
    p: ({ children }: any) => <p className="text-lg leading-relaxed text-slate-600 mb-6 font-medium">{children}</p>,
    strong: ({ children }: any) => {
      const text = String(children);
      if (isMnemo(text)) {
        const letters = parseMnemoLetters(text);
        return (
          <span className="inline-flex gap-1 my-2">
            {letters.map((l, i) => (
              <span key={i} className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                {l}
              </span>
            ))}
          </span>
        );
      }
      return <strong className="font-black text-slate-900 bg-indigo-50 px-1 rounded-sm">{children}</strong>;
    },
    blockquote: ({ children }: any) => (
      <div className="my-8 p-8 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-[2rem] border-l-8 border-indigo-500 relative overflow-hidden">
        <div className="relative z-10 text-indigo-900 font-bold italic text-xl leading-relaxed">
          {children}
        </div>
        <Lightbulb className="absolute -right-4 -bottom-4 w-32 h-32 text-indigo-500/10 -rotate-12" />
      </div>
    ),
    ul: ({ children }: any) => <ul className="space-y-4 my-8">{children}</ul>,
    li: ({ children }: any) => (
      <li className="flex gap-4 items-start group">
        <div className="mt-1.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <CheckCircle2 size={12} className="text-emerald-600" />
        </div>
        <span className="text-lg text-slate-600 font-medium leading-snug">{children}</span>
      </li>
    ),
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Progress Bar Top */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-slate-100 z-[60]">
        <motion.div
          className="h-full bg-indigo-600"
          initial={{ width: 0 }}
          animate={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-20 pb-20">
        <BreadcrumbParcours currentPage={lesson.title} />

        <Link
          href={parcoursId ? `/parcours/${parcoursId}` : "/parcours"}
          className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-zinc-400 hover:text-indigo-600 mb-8 transition-all group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          {parcoursId ? "Retour au parcours" : "Retour au catalogue"}
        </Link>

        <AnimatePresence mode="wait">
          {step === "reading" && (
            <motion.div
              key="reading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <article className="space-y-10">
                <header className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-indigo-100 text-indigo-600 border-0">
                      {lesson.level}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-zinc-100 text-zinc-500 border-0">
                      {lesson.category}
                    </Badge>
                  </div>

                  <h1 className="text-5xl font-black tracking-tight text-slate-900 leading-[1.1]">
                    {lesson.title}
                  </h1>

                  {lesson.objective && (
                    <div className="p-6 bg-white border border-zinc-100 rounded-[2rem] flex gap-5 items-center shadow-sm">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <Target size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">
                          Objectif de la leçon
                        </p>
                        <p className="text-slate-700 font-bold text-lg">{lesson.objective}</p>
                      </div>
                    </div>
                  )}
                </header>

                <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-zinc-200/50 border border-white">
                  <div className="prose-none max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {cleanContent}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="pt-6">
                  <Button
                    size="lg"
                    className="w-full h-20 text-xl font-black rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    onClick={handleFinishLesson}
                  >
                    {exercise ? (
                      <span className="flex items-center gap-3">Valider & Passer au Quiz <ArrowRight /></span>
                    ) : (
                      "Terminer la leçon"
                    )}
                  </Button>
                </div>
              </article>
            </motion.div>
          )}

          {step === "quiz" && exercise && (
            <motion.div key="quiz" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}>
              <div className="space-y-8">
                <div className="flex justify-between items-center bg-white px-8 py-6 rounded-[2rem] border border-zinc-100 shadow-sm">
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Entraînement</p>
                    <h2 className="text-xl font-black text-slate-800">{lesson.title}</h2>
                  </div>
                  <div className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-black">
                    {currentQ + 1} / {exercise.content.questions.length}
                  </div>
                </div>

                <Card className="border-none shadow-2xl shadow-zinc-200/50 bg-white rounded-[2.5rem] overflow-hidden">
                  <CardContent className="p-12 text-center space-y-10">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                      <GraduationCap size={32} />
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 leading-tight">
                      {exercise.content.questions[currentQ]}
                    </h3>

                    <div className="grid grid-cols-1 gap-4 text-left max-w-2xl mx-auto">
                      {exercise.content.options[currentQ].map((opt: string, i: number) => (
                        <button
                          key={i}
                          disabled={isChecked}
                          onClick={() => setSelected(i)}
                          className={`
                            w-full p-6 rounded-2xl border-2 transition-all font-bold text-lg flex items-center justify-between group
                            ${selected === i ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-zinc-100 bg-white text-slate-500 hover:border-indigo-200 hover:text-indigo-600'}
                            ${isChecked && i === exercise.content.correct_answers[currentQ] ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : ''}
                            ${isChecked && selected === i && i !== exercise.content.correct_answers[currentQ] ? 'border-rose-500 bg-rose-50 text-rose-900' : ''}
                          `}
                        >
                          <span>{opt}</span>
                          {isChecked && i === exercise.content.correct_answers[currentQ] && <CheckCircle2 className="text-emerald-500" />}
                          {isChecked && selected === i && i !== exercise.content.correct_answers[currentQ] && <XCircleIcon className="text-rose-500" />}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  {!isChecked ? (
                    <Button
                      disabled={selected === null}
                      onClick={() => {
                        setIsChecked(true);
                        if (selected === exercise.content.correct_answers[currentQ]) setScore(score + 1);
                      }}
                      className="px-12 h-16 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100"
                    >
                      Vérifier ma réponse
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNextQuestion}
                      className="px-12 h-16 bg-zinc-900 hover:bg-black rounded-2xl font-black text-lg shadow-xl shadow-zinc-200"
                    >
                      {currentQ < exercise.content.questions.length - 1 ? "Question Suivante" : "Terminer la session"}
                      <ArrowRight className="ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === "result" && (
            <motion.div key="result" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-12 py-12">
              <div className="relative inline-block">
                <div className={`w-48 h-48 rounded-[3rem] flex items-center justify-center mx-auto relative z-10
                  ${(!exercise || score >= (exercise?.content?.questions?.length || 0) / 2) ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'} rotate-12`}>
                  <Sparkles size={80} />
                </div>
                <div className="absolute inset-0 bg-indigo-200 blur-3xl opacity-20 -z-10" />
              </div>

              <div className="space-y-4">
                <h2 className="text-5xl font-black text-slate-900">Bien joué !</h2>
                <p className="text-2xl text-slate-500 font-medium italic">Vous avez complété la leçon avec succès.</p>
              </div>

              <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
                <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">Score</p>
                  <p className="text-4xl font-black text-indigo-600">
                    {(exercise && exercise.content.questions.length > 0)
                      ? Math.round((score / exercise.content.questions.length) * 100)
                      : 100}%
                  </p>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">Récompense</p>
                  <p className="text-4xl font-black text-amber-500">+100 XP</p>
                </div>
              </div>

              <Button
                size="lg"
                className="px-16 h-20 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-2xl font-black shadow-2xl shadow-indigo-200 transition-all hover:scale-105"
                onClick={() => router.push(`/lessons/${id}/complete${parcoursId ? `?parcoursId=${parcoursId}` : ''}`)}
              >
                Continuer
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function XCircleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}
