"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Target, Sparkles, ArrowRight,
  GraduationCap, CheckCircle2, Bot,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import LessonMarkdown from "@/components/shared/LessonMarkdown";

import { splitTitle, parseObjective } from "@/lib/lessons";
// ─── helpers ────────────────────────────────────────────────────────────────



// ─── components ─────────────────────────────────────────────────────────────

const ObjectiveContent = ({ children }: { children: any }) => {
  const content = children?.toString() || "";
  const { description, skills } = parseObjective(content);

  if (skills.length > 0) {
    return (
      <div className="space-y-4">
        <p className="text-slate-700 font-medium">{description}</p>
        <div className="space-y-2">
          <p className="text-xs font-black uppercase text-indigo-400 tracking-widest">À la fin, vous serez capable de :</p>
          {skills.map((skill: string, index: number) => (
            <div key={index} className="flex items-start gap-3 text-slate-700 font-medium">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
              <span>{skill}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <p className="text-slate-700 font-bold text-lg">{description}</p>;
};

export default function LessonInteractive({ lesson, exercise, initialUser }: { lesson: any, exercise: any, initialUser: any }) {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<"reading" | "quiz" | "result">("reading");
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

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
      router.push(`/tef-irn/lessons/${lesson.slug}/complete`);
    }
  };

  const handleFinishLesson = async () => {
    if (!initialUser) {
        setStep("quiz"); // Will show the soft-gate
        return;
    }

    if (exercise) {
      setStep("quiz");
    } else {
      setLoading(true);
      await awardXpOnly();
      router.push(`/tef-irn/lessons/${lesson.slug}/complete`);
    }
  };

  const awardXpOnly = async () => {
    if (initialUser) {
      await supabase.from('lesson_progress').upsert({ user_id: initialUser.id, lesson_id: lesson.id });
      await supabase.rpc('increment_xp', { amount: 100 });
    }
  };

  const saveResults = async () => {
    if (initialUser && exercise) {
      const totalQuestions = exercise.content.questions.length;
      const finalScore = (score / totalQuestions) * 100;
      await supabase.from('exercise_attempts').insert({
        user_id: initialUser.id,
        exercise_id: exercise.id,
        score: finalScore,
        is_completed: true,
      });
      if (finalScore >= 50) {
        await supabase.from('lesson_progress').upsert({ user_id: initialUser.id, lesson_id: lesson.id });
        await supabase.rpc('increment_xp', { amount: 100 });
      }
    }
  };

  const { main: mainTitle, subtitle } = splitTitle(lesson.title || "");

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-20">
      {step === "reading" && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-zinc-100">
          <motion.div className="h-full bg-indigo-500" style={{ width: `${readingProgress}%` }} transition={{ ease: "linear", duration: 0.1 }} />
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 pt-12">
        <AnimatePresence mode="wait">
          {step === "reading" && (
            <motion.div key="reading" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <article className="space-y-10">
                <header className="space-y-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Link href="/tef-irn/lessons">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white shadow-sm border border-transparent hover:border-zinc-100 transition-all">
                          <ArrowLeft size={20} />
                        </Button>
                      </Link>
                      <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-50 border-none font-black uppercase tracking-[0.2em] text-[10px] px-4 py-1.5 rounded-full shadow-sm">
                        {lesson.category}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const coachBtn = document.querySelector(".fixed.bottom-6.right-6") as HTMLButtonElement;
                        if (coachBtn) coachBtn.click();
                      }}
                      className="rounded-xl border-indigo-100 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 font-bold flex gap-2 h-9"
                    >
                      <Bot size={16} />
                      Question au Coach ?
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h1 className="text-5xl font-black tracking-tight text-slate-900 leading-[1.1]">{mainTitle}</h1>
                    {subtitle && <p className="text-lg font-medium text-indigo-500 leading-tight">{subtitle}</p>}
                  </div>

                  {lesson.objective && (
                    <div className="p-6 bg-white border border-zinc-100 rounded-[2rem] flex gap-5 items-start shadow-sm">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 mt-1"><Target size={24} /></div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">Objectif de la leçon</p>
                        <ObjectiveContent>{lesson.objective}</ObjectiveContent>
                      </div>
                    </div>
                  )}
                </header>

                <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-zinc-200/50 border border-white">
                  <LessonMarkdown content={lesson.content} />
                </div>

                <div className="pt-6">
                  <Button
                    size="lg"
                    className="w-full h-20 text-xl font-black rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    onClick={handleFinishLesson}
                  >
                    {exercise ? <span className="flex items-center gap-3">Valider & Passer au Quiz <ArrowRight /></span> : "Terminer la leçon"}
                  </Button>
                </div>
              </article>
            </motion.div>
          )}

          {step === "quiz" && (
            <motion.div key="quiz" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}>
              {!initialUser ? (
                <div className="text-center py-20 space-y-8 bg-white rounded-[3rem] shadow-xl border border-zinc-100 p-12">
                   <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                      <GraduationCap size={48} />
                   </div>
                   <div className="space-y-4">
                      <h2 className="text-4xl font-black text-slate-900">Teste tes connaissances !</h2>
                      <p className="text-xl text-slate-500 font-medium max-w-md mx-auto">
                        Connecte-toi gratuitement pour accéder au quiz, tester tes acquis et gagner de l'XP.
                      </p>
                   </div>
                   <div className="flex flex-col gap-4 max-w-xs mx-auto pt-6">
                      <Link href={`/tef-irn/login?redirect=/tef-irn/lessons/${lesson.slug}`}>
                        <Button size="lg" className="w-full h-16 text-lg font-black rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100">
                          Se connecter
                        </Button>
                      </Link>
                      <Button variant="ghost" onClick={() => setStep("reading")} className="font-bold text-slate-400">
                        Retour à la leçon
                      </Button>
                   </div>
                </div>
              ) : exercise ? (
                <div className="space-y-8">
                  <div className="flex justify-between items-center bg-white px-8 py-6 rounded-[2rem] border border-zinc-100 shadow-sm">
                    <div>
                      <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Entraînement</p>
                      <h2 className="text-xl font-black text-slate-800">{mainTitle}</h2>
                    </div>
                    <div className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-black">
                      {currentQ + 1} / {exercise.content.questions.length}
                    </div>
                  </div>

                  <Card className="border-none shadow-2xl shadow-zinc-200/50 bg-white rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-12 text-center space-y-10">
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto"><GraduationCap size={32} /></div>
                      <h3 className="text-3xl font-black text-slate-800 leading-tight">{exercise.content.questions[currentQ]}</h3>
                      <div className="grid grid-cols-1 gap-4 text-left max-w-2xl mx-auto">
                        {exercise.content.options[currentQ].map((opt: string, i: number) => (
                          <button
                            key={i}
                            disabled={isChecked}
                            onClick={() => setSelected(i)}
                            className={`w-full p-6 rounded-2xl border-2 transition-all font-bold text-lg flex items-center justify-between group
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
                      <Button onClick={handleNextQuestion} className="px-12 h-16 bg-zinc-900 hover:bg-black rounded-2xl font-black text-lg shadow-xl shadow-zinc-200">
                        {currentQ < exercise.content.questions.length - 1 ? "Question Suivante" : "Terminer la session"}
                        <ArrowRight className="ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}

          {step === "result" && (
            <motion.div key="result" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-12 py-12">
              <div className="relative inline-block">
                <div className={`w-48 h-48 rounded-[3rem] flex items-center justify-center mx-auto relative z-10 ${(!exercise || score >= (exercise?.content?.questions?.length || 0) / 2) ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'} rotate-12`}>
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
                  <p className="text-4xl font-black text-indigo-600">{(exercise && exercise.content.questions.length > 0) ? Math.round((score / exercise.content.questions.length) * 100) : 100}%</p>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">Récompense</p>
                  <p className="text-4xl font-black text-amber-500">+100 XP</p>
                </div>
              </div>
              <Button size="lg" className="px-16 h-20 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-2xl font-black shadow-2xl shadow-indigo-200 transition-all hover:scale-105" onClick={() => router.push(`/tef-irn/lessons/${lesson.slug}/complete`)}>
                Retour au Dashboard
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
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}
