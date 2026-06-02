"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowLeft, Loader2, BookOpen, Target, Sparkles, XCircle, ArrowRight } from "lucide-react";
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
      // 1. Charger la leçon
      const { data: lessonData } = await supabase.from('lessons').select('*').eq('id', id).single();
      if (lessonData) setLesson(lessonData);

      // 2. Charger l'exercice lié
      const { data: exoData } = await supabase.from('exercises').select('*').eq('lesson_id', id).limit(1).single();
      if (exoData) setExercise(exoData);

      setLoading(false);
    }
    fetchData();
  }, [id, supabase]);

  const handleNextQuestion = () => {
    if (currentQ < exercise.content.questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelected(null);
      setIsChecked(false);
    } else {
      setStep("result");
      saveResults();
    }
  };

  const saveResults = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const finalScore = (score / exercise.content.questions.length) * 100;
      // Enregistrer la tentative
      await supabase.from('exercise_attempts').insert({
        user_id: user.id,
        exercise_id: exercise.id,
        score: finalScore,
        is_completed: true
      });
      // Enregistrer la progression leçon
      if (finalScore >= 50) {
        await supabase.from('lesson_progress').upsert({ user_id: user.id, lesson_id: id });
        // Donner des XP
        const { data: profile } = await supabase.from('profiles').select('total_xp').eq('id', user.id).single();
        await supabase.from('profiles').update({ total_xp: (profile?.total_xp || 0) + 100 }).eq('id', user.id);
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>;
  if (!lesson) return <div className="p-8 text-center">Leçon non trouvée.</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Link href="/lessons" className="flex items-center gap-2 text-muted-foreground hover:text-indigo-600 transition-colors mb-8 group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Retour au catalogue
      </Link>

      <AnimatePresence mode="wait">
        {step === "reading" && (
          <motion.div key="reading" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <article className="space-y-8">
              <header className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-indigo-600">Niveau {lesson.level}</Badge>
                  <Badge variant="outline" className="capitalize">{lesson.category}</Badge>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-900">{lesson.title}</h1>
                {lesson.objective && (
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-3 items-start">
                    <Target className="text-indigo-600 shrink-0 mt-1" size={20} />
                    <div>
                      <p className="text-xs font-black uppercase text-indigo-400 tracking-widest">Objectif de la leçon</p>
                      <p className="text-indigo-900 font-medium">{lesson.objective}</p>
                    </div>
                  </div>
                )}
              </header>

              <Card className="border-none shadow-none bg-white p-8 rounded-2xl border border-slate-100">
                <div className="prose prose-indigo max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.content}</ReactMarkdown>
                </div>
              </Card>

              <Button
                size="lg"
                className="w-full h-16 text-lg font-bold rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100"
                onClick={() => exercise ? setStep("quiz") : router.push('/lessons')}
              >
                {exercise ? "Passer au quiz d'application" : "Terminer la leçon"} <ArrowRight className="ml-2" />
              </Button>
            </article>
          </motion.div>
        )}

        {step === "quiz" && exercise && (
          <motion.div key="quiz" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
             <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black">Quiz : {lesson.title}</h2>
                  <Badge variant="secondary">Question {currentQ + 1} / {exercise.content.questions.length}</Badge>
                </div>

                <div className="p-12 bg-white border-2 border-slate-100 rounded-3xl text-2xl text-center font-bold text-slate-800 shadow-xl shadow-slate-100">
                  {exercise.content.questions[currentQ]}
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {exercise.content.options[currentQ].map((opt: string, i: number) => (
                    <button
                      key={i}
                      disabled={isChecked}
                      onClick={() => setSelected(i)}
                      className={`
                        w-full p-6 rounded-2xl border-2 text-left transition-all font-bold text-lg
                        ${selected === i ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-100 bg-white text-slate-600 hover:border-indigo-200'}
                        ${isChecked && i === exercise.content.correct_answers[currentQ] ? 'border-green-500 bg-green-50 text-green-900' : ''}
                        ${isChecked && selected === i && i !== exercise.content.correct_answers[currentQ] ? 'border-red-500 bg-red-50 text-red-900' : ''}
                      `}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end pt-4">
                  {!isChecked ? (
                    <Button
                      disabled={selected === null}
                      onClick={() => { setIsChecked(true); if(selected === exercise.content.correct_answers[currentQ]) setScore(score+1); }}
                      className="px-12 h-14 bg-indigo-600 rounded-xl font-bold text-lg"
                    >
                      Vérifier
                    </Button>
                  ) : (
                    <Button onClick={handleNextQuestion} className="px-12 h-14 bg-indigo-600 rounded-xl font-bold text-lg">
                      {currentQ < exercise.content.questions.length - 1 ? "Suivant" : "Voir mon score"} <ArrowRight className="ml-2" />
                    </Button>
                  )}
                </div>
             </div>
          </motion.div>
        )}

        {step === "result" && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-8 pt-12">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 ${score === exercise.content.questions.length ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}`}>
               <Sparkles size={60} />
            </div>
            <h2 className="text-4xl font-black">Session terminée !</h2>
            <div className="text-6xl font-black text-indigo-600">
               {Math.round((score / exercise.content.questions.length) * 100)}%
            </div>
            <p className="text-xl text-muted-foreground">
              {score >= exercise.content.questions.length / 2 ? "Bravo ! Tu as validé cette leçon et gagné +100 XP." : "C'est un bon début, mais n'hésite pas à relire la leçon pour t'améliorer."}
            </p>
            <Button size="lg" className="px-12 h-16 rounded-2xl bg-indigo-600 text-xl font-bold" onClick={() => router.push('/lessons')}>
              Retour au catalogue
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
