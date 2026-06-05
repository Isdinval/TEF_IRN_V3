"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Target, Sparkles, ArrowRight, Lightbulb, BookOpen, GraduationCap, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function LessonDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lesson, setLesson] = useState<any>(null);
  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"reading" | "quiz" | "result">("reading");

  // Quiz state
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const { data: lessonData } = await supabase.from('lessons').select('*').eq('id', id).single();
      if (lessonData) setLesson(lessonData);

      const { data: exoData } = await supabase.from('exercises').select('*').eq('lesson_id', id).limit(1).single();
      if (exoData) setExercise(exoData);

      setLoading(false);
    }
    fetchData();
  }, [id, supabase]);

  const handleNextQuestion = async () => {
    if (currentQ < exercise.content.questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelected(null);
      setIsChecked(false);
    } else {
      setLoading(true);
      await saveResults();
      setStep("result");
      setLoading(false);
    }
  };

  const saveResults = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const finalScore = (score / exercise.content.questions.length) * 100;

      // 1. Enregistrer la tentative
      await supabase.from('exercise_attempts').insert({
        user_id: user.id,
        exercise_id: exercise.id,
        score: finalScore,
        is_completed: true
      });

      // 2. Enregistrer la progression leçon & XP
      if (finalScore >= 50) {
        await supabase.from('lesson_progress').upsert({ user_id: user.id, lesson_id: id });

        // Update XP using RPC function created previously
        const { error: rpcError } = await supabase.rpc('increment_xp', { amount: 100 });

        if (rpcError) {
          console.error("RPC Error, falling back to profile update:", rpcError);
          const { data: profile } = await supabase.from('profiles').select('total_xp').eq('id', user.id).single();
          await supabase.from('profiles').update({ total_xp: (profile?.total_xp || 0) + 100 }).eq('id', user.id);
        }
      }
    }
  };

  if (loading && step === "reading") return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;
  if (!lesson) return <div className="p-8 text-center text-slate-500 font-bold">Leçon non trouvée.</div>;

  const markdownComponents = {
    h1: ({ children }: any) => <h1 className="hidden">{children}</h1>,
    h2: ({ children }: any) => {
      const title = children?.toString() || "";
      const isTheorie = title.includes("Théorie");
      const isExemple = title.includes("Exemple");
      return (
        <div className="flex items-center gap-3 mt-12 mb-6">
          <div className={`p-2 rounded-lg ${isTheorie ? 'bg-indigo-100 text-indigo-600' : isExemple ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
            {isTheorie ? <BookOpen size={20} /> : isExemple ? <GraduationCap size={20} /> : <Sparkles size={20} />}
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">{children}</h2>
        </div>
      );
    },
    h3: ({ children }: any) => <h3 className="text-lg font-bold text-slate-700 mt-8 mb-4 border-l-4 border-indigo-200 pl-4">{children}</h3>,
    p: ({ children }: any) => <p className="text-slate-600 leading-relaxed mb-4 font-medium">{children}</p>,
    ul: ({ children }: any) => <ul className="space-y-3 my-6">{children}</ul>,
    li: ({ children }: any) => (
      <li className="flex items-start gap-3 text-slate-600 font-medium">
        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
        <span>{children}</span>
      </li>
    ),
    blockquote: ({ children }: any) => (
      <div className="my-10 p-8 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-100 rounded-[2rem] relative overflow-hidden shadow-sm">
        <Lightbulb className="absolute -right-4 -top-4 text-amber-200/30 w-32 h-32 rotate-12" />
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase text-amber-600 tracking-[0.2em] mb-3 flex items-center gap-2">
            <Lightbulb size={14} fill="currentColor" /> L'Astuce du Coach
          </p>
          <div className="text-amber-900 font-bold italic text-lg leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    ),
    strong: ({ children }: any) => <strong className="font-black text-indigo-900">{children}</strong>,
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-20">
      {loading && step !== "reading" && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="animate-spin text-indigo-600 mx-auto" size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Enregistrement de vos progrès...</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 pt-8">
        <Link href="/lessons" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-indigo-600 transition-colors mb-10 group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Retour au catalogue
        </Link>

        <AnimatePresence mode="wait">
          {step === "reading" && (
            <motion.div key="reading" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <article className="space-y-10">
                <header className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-indigo-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Niveau {lesson.level}</Badge>
                    <Badge variant="outline" className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border-zinc-200 text-zinc-400">{lesson.category}</Badge>
                  </div>
                  <h1 className="text-5xl font-black tracking-tight text-slate-900 leading-[1.1]">{lesson.title}</h1>

                  {lesson.objective && (
                    <div className="p-6 bg-white border border-zinc-100 rounded-[2rem] flex gap-5 items-center shadow-sm">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <Target size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">Objectif de la leçon</p>
                        <p className="text-slate-700 font-bold text-lg">{lesson.objective}</p>
                      </div>
                    </div>
                  )}
                </header>

                <div className="bg-white p-10 md:p-12 rounded-[2.5rem] shadow-xl shadow-zinc-200/50 border border-white">
                  <div className="prose prose-slate max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {lesson.content}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="pt-6">
                  <Button
                    size="lg"
                    className="w-full h-20 text-xl font-black rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => exercise ? setStep("quiz") : router.push('/lessons')}
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
                        onClick={() => { setIsChecked(true); if(selected === exercise.content.correct_answers[currentQ]) setScore(score+1); }}
                        className="px-12 h-16 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100"
                      >
                        Vérifier ma réponse
                      </Button>
                    ) : (
                      <Button onClick={handleNextQuestion} className="px-12 h-16 bg-zinc-900 hover:bg-black rounded-2xl font-black text-lg shadow-xl shadow-zinc-200">
                        {currentQ < exercise.content.questions.length - 1 ? "Question Suivante" : "Terminer la session"} <ArrowRight className="ml-2" />
                      </Button>
                    )}
                  </div>
               </div>
            </motion.div>
          )}

          {step === "result" && (
            <motion.div key="result" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-12 py-12">
              <div className="relative inline-block">
                <div className={`w-48 h-48 rounded-[3rem] flex items-center justify-center mx-auto relative z-10 ${score === exercise.content.questions.length ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'} rotate-12`}>
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
                  <p className="text-4xl font-black text-indigo-600">{exercise.content.questions.length > 0 ? Math.round((score / exercise.content.questions.length) * 100) : 100}%</p>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm">
                  <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-2">Récompense</p>
                  <p className="text-4xl font-black text-amber-500">+100 XP</p>
                </div>
              </div>

              <Button
                size="lg"
                className="px-16 h-20 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-2xl font-black shadow-2xl shadow-indigo-200 transition-all hover:scale-105"
                onClick={() => router.push('/dashboard')}
              >
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
