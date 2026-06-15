"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ArrowRight,
  BookOpen,
  Target,
  Sparkles,
  Zap,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParcours } from '@/contexts/ParcoursContext';

interface Exercise {
  id: string;
  instructions: string;
  type: string;
  category: string;
  level: string;
  content: {
    questions: string[];
    options: string[][];
    correct_answers: number[];
  };
}

function PracticeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const { activeParcours, nextLesson } = useParcours();

  const [mode, setMode] = useState<"selection" | "practice">("selection");
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const id = searchParams.get('id');
  const lessonId = searchParams.get('lessonId');
  const topic = searchParams.get('topic');
  const level = searchParams.get('level');
  const isReviewMode = searchParams.get('mode') === 'review';

  useEffect(() => {
    const init = async () => {
      if (id) {
        await fetchExerciseById(id);
      } else if (lessonId && !topic) {
        await fetchExercise(lessonId);
      } else if (topic) {
        await autoStart(lessonId || undefined, topic, level || undefined);
      } else if (isReviewMode) {
        await fetchReviewExercises();
      } else {
        setMode("selection");
      }
    };
    init();
  }, [id, lessonId, topic, isReviewMode]);

  const fetchExerciseById = async (exId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exId)
      .single();

    if (data) {
      setExercise(data as Exercise);
      setMode("practice");
    }
    setIsLoading(false);
  };

  const fetchExercise = async (lid: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('lesson_id', lid)
      .eq('type', 'qcm')
      .limit(1)
      .single();

    if (data) {
      setExercise(data as Exercise);
      setMode("practice");
    }
    setIsLoading(false);
  };

  const autoStart = async (lid?: string, t?: string, lvl?: string) => {
    setIsLoading(true);
    let query = supabase.from('exercises').select('*').eq('type', 'qcm');

    if (lid) query = query.eq('lesson_id', lid);
    if (t) query = query.ilike('category', `%${t}%`);
    if (lvl) query = query.eq('level', lvl);

    const { data } = await query.limit(1).single();

    if (data) {
      setExercise(data as Exercise);
      setMode("practice");
    } else if (t) {
       const { data: searchData } = await supabase
         .from('exercises')
         .select('*')
         .eq('type', 'qcm')
         .filter('instructions', 'ilike', `%${t}%`)
         .limit(1)
         .single();

       if (searchData) {
         setExercise(searchData as Exercise);
         setMode("practice");
       }
    }
    setIsLoading(false);
  };

  const fetchReviewExercises = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .eq('type', 'qcm')
      .limit(1)
      .single();

    if (data) {
      setExercise(data as Exercise);
      setMode("practice");
    }
    setIsLoading(false);
  };

  const handleCheck = () => {
    if (selected === null) return;
    setIsChecked(true);
    if (selected === exercise?.content.correct_answers[currentQuestionIndex]) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = async () => {
    const totalQuestions = exercise?.content.questions.length || 0;
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelected(null);
      setIsChecked(false);
    } else {
      setIsSaving(true);
      await saveResult();
      setIsFinished(true);
      setIsSaving(false);
      router.refresh(); // Clear client-side cache for server data
    }
  };

  const saveResult = async () => {
    const total = exercise?.content.questions.length || 1;
    const finalScore = Math.round((score / total) * 100);
    const { data: { user } } = await supabase.auth.getUser();

    if (user && exercise) {
      try {
        const response = await fetch('/api/exercise-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exerciseId: exercise.id,
            score: finalScore,
            answers: {
              correct: score,
              total: total
            }
          })
        });
        if (!response.ok) throw new Error("Failed to save");
        console.log("Result saved successfully");
      } catch (err) {
        console.error("Error saving result:", err);
      }
    }
  };

  if (isLoading || isSaving) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-zinc-50">
        <Loader2 className="h-12 w-12 animate-spin text-rose-600" />
        <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
          {isSaving ? "Enregistrement de vos progrès..." : "Chargement de l'exercice..."}
        </p>
      </div>
    );
  }

  if (mode === "selection") {
    return (
      <div className="min-h-screen bg-zinc-50 p-8 pt-20">
        <div className="max-w-4xl mx-auto space-y-12">
          <header>
            <h1 className="text-5xl font-black text-zinc-900 tracking-tighter mb-4 uppercase">Centre d'entraînement</h1>
            <p className="text-zinc-500 font-medium italic text-lg">Choisissez votre mode de pratique pour booster votre score TEF.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card
              className="group border-none shadow-xl shadow-zinc-100 rounded-[3rem] p-10 bg-white hover:shadow-2xl hover:shadow-rose-100 transition-all cursor-pointer relative overflow-hidden"
              onClick={() => fetchReviewExercises()}
            >
               <div className="relative z-10">
                  <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                    <Zap size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-zinc-900 mb-2 uppercase">Révision Intelligente</h3>
                  <p className="text-zinc-500 text-sm font-medium mb-8 leading-relaxed italic">
                    L'IA sélectionne les notions où vous avez le plus de difficultés.
                  </p>
                  <Button className="rounded-2xl bg-zinc-900 text-white font-black px-8 h-12 uppercase text-xs tracking-widest">
                    Lancer l'SRS
                  </Button>
               </div>
               <Sparkles className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12" />
            </Card>

            <Card className="border-none shadow-xl shadow-zinc-100 rounded-[2.5rem] p-8 bg-zinc-50 border border-zinc-100">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="text-zinc-400" size={20} />
                <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Guide Rapide</h4>
              </div>
              <div className="space-y-4">
                 <p className="text-xs text-zinc-500 font-medium leading-relaxed italic">
                   Un exercice est composé de plusieurs questions. Lisez attentivement et choisissez la bonne option.
                 </p>
                 <div className="h-px bg-zinc-200 w-full" />
                 <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase">
                    <Target size={14} className="text-rose-600" /> Objectif : 80% de réussite
                 </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (isFinished && exercise) {
    const totalQuestions = exercise.content.questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    return (
      <div className="flex items-center justify-center min-h-screen p-8 bg-zinc-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xl"
        >
          <Card className="text-center p-12 rounded-[4rem] shadow-2xl shadow-rose-100 border-none bg-white">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="text-green-600" size={48} />
            </div>
            <h1 className="text-4xl font-black mb-4 tracking-tighter">Exercice Terminé !</h1>
            <p className="text-zinc-400 mb-10 font-bold text-lg">
              Tu as répondu correctement à <span className="text-zinc-900">{score}</span> questions sur <span className="text-zinc-900">{totalQuestions}</span>.
            </p>

            <div className="relative mb-12">
               <div className="text-8xl font-black text-rose-600 tracking-tighter">
                {percentage}%
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-300 mt-2">Score de maîtrise</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-10">
               <div className="bg-zinc-50 p-6 rounded-3xl">
                  <div className="text-zinc-400 text-[10px] font-black uppercase mb-1">XP GAGNÉS</div>
                  <div className="text-2xl font-black text-zinc-900">+{percentage}</div>
               </div>
               <div className="bg-zinc-50 p-6 rounded-3xl">
                  <div className="text-zinc-400 text-[10px] font-black uppercase mb-1">DASHBOARD</div>
                  <div className="text-xs font-black text-rose-600 uppercase">Mise à jour OK</div>
               </div>
            </div>

            <div className="space-y-4">
              {activeParcours && (
                <Button
                  className="w-full h-20 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-3xl text-xl shadow-2xl shadow-rose-200 transition-all"
                  onClick={() => nextLesson()}
                >
                  Continuer mon parcours
                </Button>
              )}
              <Button
                variant={activeParcours ? "ghost" : "default"}
                className={`w-full ${activeParcours ? 'h-12 text-zinc-400 hover:text-rose-600' : 'h-20 bg-zinc-900 hover:bg-zinc-800 text-white'} font-black rounded-3xl text-lg transition-all`}
                onClick={() => {
                  if (activeParcours) {
                    router.push(`/parcours/${activeParcours.id}`);
                  } else {
                    setMode("selection");
                  }
                }}
              >
                {activeParcours ? "Retour au parcours" : "Refaire un exercice"}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  const currentQuestionText = exercise?.content?.questions[currentQuestionIndex];
  const currentOptions = exercise?.content?.options[currentQuestionIndex];
  const totalQuestions = exercise?.content?.questions.length || 5;

  return (
    <div className="max-w-3xl mx-auto p-8 pt-16 min-h-screen flex flex-col">
      <header className="mb-12 flex justify-between items-end">
        <div className="space-y-2">
          <button
            onClick={() => {
              if (activeParcours) {
                router.push(`/parcours/${activeParcours.id}`);
              } else {
                setMode("selection");
              }
            }}
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-900 transition-colors font-bold text-sm mb-4"
          >
            <ChevronLeft size={16} /> Quitter
          </button>
          <div className="flex items-center gap-3">
            <Badge className="bg-rose-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 border-none">
              {exercise?.level} • {isReviewMode ? "Révision" : exercise?.category}
            </Badge>
            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest italic">QCM Voltaire</span>
          </div>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">
            {exercise?.instructions.replace('.', '')}
          </h2>
        </div>
        <div className="flex flex-col items-end gap-3">
            <div className="text-xs font-black text-zinc-400 uppercase tracking-widest bg-zinc-100 px-4 py-2 rounded-full border border-zinc-200">
              Question {currentQuestionIndex + 1} / {totalQuestions}
            </div>
            <div className="h-1.5 w-32 bg-zinc-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-rose-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                />
            </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center mb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <div className="p-12 bg-white border-2 border-zinc-100 shadow-2xl shadow-zinc-100 rounded-[4rem] text-4xl text-center font-black text-zinc-900 leading-tight tracking-tight relative">
               <Target className="absolute -top-6 left-1/2 -translate-x-1/2 text-rose-600 bg-white w-12 h-12 p-2 rounded-2xl shadow-lg border-2 border-zinc-100" />
              {currentQuestionText}
            </div>

            <div className="grid grid-cols-1 gap-4">
              <p className="text-center text-xs font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">Choisissez la bonne réponse :</p>
              {currentOptions?.map((option, i) => (
                <button
                  key={i}
                  disabled={isChecked}
                  onClick={() => setSelected(i)}
                  className={`
                    w-full p-8 rounded-3xl border-2 text-left transition-all flex justify-between items-center font-black text-xl
                    ${selected === i ? 'border-rose-600 bg-rose-50 text-rose-900 shadow-lg' : 'border-zinc-50 bg-white text-zinc-500 hover:border-zinc-200 shadow-sm'}
                    ${isChecked && i === exercise?.content.correct_answers[currentQuestionIndex] ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-none' : ''}
                    ${isChecked && selected === i && i !== exercise?.content.correct_answers[currentQuestionIndex] ? 'border-rose-500 bg-rose-50 text-rose-900 shadow-none' : ''}
                  `}
                >
                  <span>{option}</span>
                  {isChecked && i === exercise?.content.correct_answers[currentQuestionIndex] && <CheckCircle2 className="text-emerald-500" size={28} />}
                  {isChecked && selected === i && i !== exercise?.content.correct_answers[currentQuestionIndex] && <XCircle className="text-rose-500" size={28} />}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="flex justify-between items-center p-6 bg-white border border-zinc-100 rounded-[2.5rem] shadow-xl shadow-zinc-100 mb-8">
        <div className="flex gap-4">
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Score actuel</span>
              <span className="text-xl font-black text-zinc-900">{score} / {totalQuestions}</span>
           </div>
        </div>

        {!isChecked ? (
          <Button
            disabled={selected === null}
            onClick={handleCheck}
            className="h-16 px-12 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-2xl shadow-xl shadow-zinc-200 text-lg transition-all active:scale-95"
          >
            Vérifier la réponse
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="h-16 px-12 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl shadow-xl shadow-rose-100 flex gap-2 text-lg transition-all active:scale-95"
          >
            {currentQuestionIndex < totalQuestions - 1 ? "Question suivante" : "Terminer l'exercice"} <ArrowRight size={24} />
          </Button>
        )}
      </footer>
    </div>
  );
}

export default function Practice() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-rose-600" size={48} /></div>}>
      <PracticeContent />
    </Suspense>
  );
}
