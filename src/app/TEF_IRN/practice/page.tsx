"use client";

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ExerciseCard from "@/app/TEF_IRN/parcours/[id]/components/ExerciseCard";
import { Exercise } from "@/lib/parcours";
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
  Calendar,
  GraduationCap,
  Trophy,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParcours } from '@/contexts/ParcoursContext';
import { ExerciseLayout } from "@/components/shared/ExerciseLayout";
import { useExerciseFilters } from "@/hooks/useExerciseFilters";

// --- Types ---
interface Question {
  difficulty?: string;
  tags?: string[];
  is_ai_generated?: boolean;
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  level: string;
  category: string;
  instructions: string;
  explanation?: string;
}

interface ExerciseDB {
  difficulty?: string;
  tags?: string[];
  is_ai_generated?: boolean;
  id: string;
  instructions: string;
  type: string;
  category: string;
  level: string;
  content: {
    explanations?: string[];
    questions: string[];
    options: string[][];
    correct_answers: number[];
  };
}

const CATEGORIES = ["Grammaire", "Conjugaison", "Syntaxe", "Orthographe", "Toutes"];
const LEVELS = ["A1", "A2", "B1", "B2"];

export function PracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const exerciseIdFromParams = params?.id as string | undefined;
  const supabase = createClient();
  const { activeParcours, nextLesson } = useParcours();
  const { filters, setLevel, setCategory } = useExerciseFilters("A2", "Grammaire");

  const [mode, setMode] = useState<"selection" | "practice" | "result">("selection");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [catalogue, setCatalogue] = useState<Exercise[]>([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);

  const fetchCatalogue = useCallback(async () => {
    setLoadingCatalogue(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from("exercises")
        .select("*")
        .in("type", ["qcm", "association", "qcm_centre_entrainement"])
        .eq("level", filters.level);

      if (filters.category !== "Toutes") {
        query = query.ilike("category", `%${filters.category}%`);
      }

      const { data: exercises } = await query.limit(20);

      if (exercises && user) {
        const { data: attempts } = await supabase
          .from("exercise_attempts")
          .select("exercise_id, is_completed, score")
          .eq("user_id", user.id)
          .in("exercise_id", exercises.map((e: any) => e.id));

        const mapped = exercises.map((ex: any) => {
          const exAttempts = attempts?.filter((a: any) => a.exercise_id === ex.id) || [];
          return {
            ...ex,
            is_completed: exAttempts.some((a: any) => a.is_completed),
            attempts_count: exAttempts.length,
            success_rate: exAttempts.length > 0 ? Math.max(...exAttempts.map((a: any) => a.score || 0)) : undefined
          };
        });
        setCatalogue(mapped);
      } else {
        setCatalogue(exercises || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCatalogue(false);
    }
  }, [filters.level, filters.category, supabase]);

  useEffect(() => {
    if (mode === "selection") {
      fetchCatalogue();
    }
  }, [fetchCatalogue, mode]);

  const mapExerciseToQuestions = (ex: ExerciseDB): Question[] => {
    if (!ex?.content?.questions) return [];
    return ex.content.questions.map((q, idx) => ({
      id: `${ex.id}-${idx}`,
      difficulty: ex.difficulty,
      tags: ex.tags,
      is_ai_generated: ex.is_ai_generated,
      text: q,
      options: ex.content.options?.[idx] || [],
      correctAnswer: ex.content.correct_answers?.[idx] ?? 0,
      level: ex.level,
      category: ex.category,
      instructions: ex.instructions,
      explanation: ex.content.explanations?.[idx],
    }));
  };

  const fetchExerciseById = useCallback(async (exId: string) => {
    setIsLoading(true);
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exId)
      .single();

    if (data) {
      setQuestions(mapExerciseToQuestions(data as ExerciseDB));
      setMode("practice");
    }
    setIsLoading(false);
  }, [supabase]);

  const fetchFromLesson = useCallback(async (lid: string) => {
    setIsLoading(true);
    setScore(0);
    setCurrentIdx(0);
    setSelected(null);
    setIsChecked(false);

    const { data } = await supabase
      .from('exercises')
      .select('*')
      .eq('lesson_id', lid)
      .eq('type', 'qcm')
      .limit(1)
      .single();

    if (data) {
      setQuestions(mapExerciseToQuestions(data as ExerciseDB));
      setMode("practice");
    }
    setIsLoading(false);
  }, [supabase]);

  const fetchReviewExercises = useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: attempts } = await supabase
      .from('exercise_attempts')
      .select('exercise_id')
      .eq('user_id', user.id)
      .lt('score', 70)
      .limit(5);

    if (attempts && attempts.length > 0) {
      const ids = attempts.map((a: any) => a.exercise_id);
      const { data: exercises } = await supabase
        .from('exercises')
        .select('*')
        .in('id', ids);

      if (exercises) {
        setQuestions((exercises as ExerciseDB[]).flatMap(mapExerciseToQuestions));
        setMode("practice");
      }
    } else {
      setMode("selection");
    }
    setIsLoading(false);
  }, [supabase]);

  const autoStart = useCallback(async (lid?: string, t?: string, lvl?: string) => {
    setIsLoading(true);
    let query = supabase.from('exercises').select('*').eq('type', 'qcm');
    if (t) query = query.ilike('category', `%${t}%`);
    if (lvl) query = query.eq('level', lvl);

    const { data } = await query.limit(5);
    if (data && data.length > 0) {
      const allQs = (data as ExerciseDB[]).flatMap(mapExerciseToQuestions);
      setQuestions(allQs.slice(0, 10));
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
         setQuestions(mapExerciseToQuestions(searchData as ExerciseDB));
         setMode("practice");
       }
    }
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    const lessonId = searchParams.get('lessonId');
    const topic = searchParams.get('topic');
    const level = searchParams.get('level');
    const isReviewMode = searchParams.get('mode') === 'review';

    const init = async () => {
      if (exerciseIdFromParams) {
        await fetchExerciseById(exerciseIdFromParams);
      } else if (lessonId && !topic) {
        await fetchFromLesson(lessonId);
      } else if (topic) {
        await autoStart(lessonId || undefined, topic, level || undefined);
      } else if (isReviewMode) {
        await fetchReviewExercises();
      } else {
        setMode("selection");
      }
    };
    init();
  }, [exerciseIdFromParams, searchParams, fetchExerciseById, fetchFromLesson, autoStart, fetchReviewExercises]);

  const startTraining = async () => {
    setIsLoading(true);
    let query = supabase.from('exercises').select('*').eq('type', 'qcm');

    query = query.eq('level', filters.level);

    if (filters.category !== "Toutes") {
      query = query.ilike('category', `%${filters.category}%`);
    }

    const { data } = await query.limit(10);
    if (data && data.length > 0) {
      const allQs = (data as ExerciseDB[])
        .flatMap(mapExerciseToQuestions)
        .sort(() => Math.random() - 0.5);
      setQuestions(allQs.slice(0, 10));
      setMode("practice");
    }
    setIsLoading(false);
  };

  const handleSelect = (idx: number) => {
    if (isChecked) return;
    setSelected(idx);
  };

  const handleCheck = () => {
    if (selected === null || isChecked) return;
    setIsChecked(true);
    if (selected === questions[currentIdx].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelected(null);
      setIsChecked(false);
    } else {
      await saveScore();
      setMode("result");
    }
  };

  const saveScore = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const finalScore = Math.round((score / questions.length) * 100);
    const exerciseId = questions[0].id.split('-')[0];

    await fetch('/api/exercise-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseId,
        score: finalScore,
        answers: { correct: score, total: questions.length }
      })
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 gap-6">
        <div className="relative">
          <Loader2 className="animate-spin text-purple-600" size={64} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-ping" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-black text-zinc-900 uppercase tracking-tighter">Préparation du centre</p>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest animate-pulse italic">Configuration des algorithmes...</p>
        </div>
      </div>
    );
  }

  // SCREEN: RESULT
  if (mode === "result") {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="p-12 text-center rounded-[4rem] shadow-2xl shadow-purple-100 border-none bg-white">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <Trophy className="text-purple-600" size={48} />
            </div>
            <h2 className="text-4xl font-black mb-2 tracking-tighter uppercase">Félicitations !</h2>
            <p className="text-zinc-500 font-bold mb-10 italic">Vous progressez vers votre objectif.</p>

            <div className="bg-zinc-50 rounded-[2.5rem] p-10 mb-10 border border-zinc-100">
               <div className="text-7xl font-black text-purple-600 mb-2 tracking-tighter">{percentage}%</div>
               <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Score de Précision</div>
            </div>

            <div className="space-y-4">
              <Button
                className="w-full h-16 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl text-lg shadow-xl shadow-purple-200 transition-all active:scale-95"
                onClick={() => {
                   setMode("selection");
                   setScore(0);
                   setCurrentIdx(0);
                }}
              >
                NOUVEL EXERCICE
              </Button>
              <Button
                variant="ghost"
                className="w-full h-12 text-zinc-400 hover:text-purple-600 font-black rounded-2xl transition-all"
                onClick={() => router.push('/TEF_IRN/dashboard')}
              >
                RETOUR AU TABLEAU DE BORD
              </Button>
              {nextLesson && (
                <Button onClick={() => nextLesson()} variant="outline" className="w-full h-16 border-2 border-zinc-100 rounded-2xl font-black text-zinc-600">LEÇON SUIVANTE</Button>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // SCREEN: SELECTION
  if (mode === "selection") {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12 lg:px-12">
          <ExerciseLayout
            title="CENTRE D’ENTRAÎNEMENT QCM"
            badge="Coach QCM"
            badgeColor="purple"
            description="Renforcez sereinement votre grammaire, conjugaison et vocabulaire grâce à des QCM adaptés au TEF IRN. Construisez votre réussite étape par étape."
          >
            {/* Quick Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-50 p-6 rounded-[2.5rem] border border-zinc-100 space-y-4">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Target size={14} className="text-purple-600" /> Votre Niveau
                </div>
                <div className="flex gap-2">
                  {LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setLevel(lvl)}
                      className={`flex-1 h-12 rounded-2xl font-black transition-all ${filters.level === lvl ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-zinc-400 border border-zinc-100 hover:border-zinc-200'}`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-50 p-6 rounded-[2.5rem] border border-zinc-100 space-y-4 lg:col-span-2">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <GraduationCap size={14} className="text-purple-600" /> Thématiques
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-6 h-12 rounded-2xl font-black text-sm transition-all ${filters.category === cat ? 'bg-zinc-900 text-white shadow-lg' : 'bg-white text-zinc-400 border border-zinc-100 hover:border-zinc-200'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div
                onClick={() => startTraining()}
                className="bg-purple-600 p-6 rounded-[2.5rem] text-white space-y-4 shadow-2xl shadow-purple-100 relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
                   <Zap size={14} /> Flash QCM
                </div>
                <h4 className="text-xl font-black leading-tight">Lancer une session rapide</h4>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                    <Calendar size={16} /> Entraînement Quotidien
                 </div>
              </div>
            </div>

            {/* Catalogue Section */}
            <section className="mt-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                  <Badge className="bg-purple-600 rounded-full px-3 py-1 text-white border-none">Niveau {filters.level}</Badge>
                  <span className="text-zinc-400">•</span>
                  <span className="capitalize text-zinc-500">{filters.category}</span>
                </h2>
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  {catalogue.length} exercice{catalogue.length > 1 ? 's' : ''} disponible{catalogue.length > 1 ? 's' : ''}
                </div>
              </div>

              {loadingCatalogue ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i: number) => (
                    <div key={i} className="h-64 rounded-[2rem] bg-zinc-100 animate-pulse" />
                  ))}
                </div>
              ) : catalogue.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {catalogue.map((ex: Exercise) => (
                    <ExerciseCard key={ex.id} exercise={ex} />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed border-2 border-zinc-200 rounded-[2rem] p-12 text-center bg-zinc-50/50">
                  <Target className="mx-auto mb-4 text-zinc-300" size={40} />
                  <p className="font-bold text-zinc-500">Aucun exercice trouvé pour cette sélection.</p>
                </Card>
              )}
            </section>
          </ExerciseLayout>
        </div>
      </div>
    );
  }

  // SCREEN: PRACTICE (Exercise Loop)
  if (mode === "practice") {
    const currentQuestion = questions[currentIdx];
    const totalQuestions = questions.length;
    const progress = ((currentIdx + 1) / totalQuestions) * 100;

    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        <ExerciseLayout
          variant="compact"
          title="CENTRE D’ENTRAÎNEMENT QCM"
          badge="Coach QCM"
          badgeColor="purple"
          onBack={() => setMode("selection")}
          rightElement={
            <div className="hidden md:flex items-center gap-6">
              <div className="text-right">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Précision</div>
                <div className="text-2xl font-black text-zinc-900">{score} / {totalQuestions}</div>
              </div>
              <div className="h-12 w-px bg-zinc-100" />
              <div className="flex flex-col gap-2">
                 <div className="w-48 h-3 bg-zinc-100 rounded-full overflow-hidden border border-zinc-50 shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-purple-600"
                    />
                 </div>
                 <div className="flex justify-between text-[8px] font-black text-zinc-300 uppercase tracking-widest">
                    <span>DÉBUT</span>
                    <span>{Math.round(progress)}%</span>
                    <span>FIN</span>
                 </div>
              </div>
            </div>
          }
        />

        <main className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
          <div className="max-w-3xl w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="space-y-12"
              >
                {/* Question Text */}
                <div className="bg-white p-16 lg:p-24 rounded-[5rem] shadow-2xl shadow-zinc-200/30 text-center relative overflow-hidden border-4 border-white ring-1 ring-zinc-100">
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-purple-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-purple-200 rotate-3 group">
                      <Target size={32} className="group-hover:scale-110 transition-transform" />
                   </div>

                   <h3 className="text-[clamp(1.5rem,3vw+1rem,2.25rem)] font-black text-zinc-900 leading-tight tracking-tight mt-6">
                    {currentQuestion?.text}
                  </h3>
                  <div className="absolute top-0 right-0 w-80 h-80 bg-purple-50 rounded-full -mr-40 -mt-40 blur-3xl opacity-30" />
                  <div className="absolute bottom-0 left-0 w-80 h-80 bg-zinc-50 rounded-full -ml-40 -mb-40 blur-3xl opacity-30" />
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 gap-5">
                   <p className="text-center text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em] mb-2">Sélectionnez la bonne réponse</p>
                  {currentQuestion?.options.map((option: string, i: number) => {
                    const isCorrect = i === currentQuestion.correctAnswer;
                    const isSelected = selected === i;

                    let buttonStyle = "border-zinc-100 bg-white text-zinc-600 hover:border-zinc-300 shadow-sm";
                    if (isChecked) {
                      if (isCorrect) buttonStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-none ring-4 ring-emerald-500/10";
                      else if (isSelected) buttonStyle = "border-rose-500 bg-rose-50 text-rose-900 shadow-none ring-4 ring-rose-500/10";
                    } else if (isSelected) {
                      buttonStyle = "border-purple-600 bg-purple-50 text-purple-900 shadow-xl ring-4 ring-purple-600/5";
                    }

                    return (
                      <motion.button
                        key={i}
                        whileHover={!isChecked ? { x: 5 } : {}}
                        whileTap={!isChecked ? { scale: 0.98 } : {}}
                        onClick={() => handleSelect(i)}
                        className={`w-full p-6 lg:p-8 rounded-3xl border-2 transition-all text-left font-bold text-lg flex items-center justify-between group ${buttonStyle}`}
                        disabled={isChecked}
                      >
                        <div className="flex items-center gap-6">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-colors ${isSelected ? 'bg-purple-600 text-white' : 'bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200'}`}>
                              {String.fromCharCode(65 + i)}
                           </div>
                           {option}
                        </div>
                        {isChecked && isCorrect && <CheckCircle2 className="text-emerald-500" size={24} />}
                        {isChecked && isSelected && !isCorrect && <XCircle className="text-rose-500" size={24} />}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Action Bar */}
                <div className="pt-8">
                  {!isChecked ? (
                    <Button
                      onClick={handleCheck}
                      disabled={selected === null}
                      className="w-full h-20 bg-zinc-900 hover:bg-black text-white font-black rounded-3xl text-xl shadow-2xl shadow-zinc-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                      VÉRIFIER MA RÉPONSE
                    </Button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                       {currentQuestion.explanation && (
                         <Card className={`p-8 rounded-[2.5rem] border-none shadow-xl ${selected === currentQuestion.correctAnswer ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-white'}`}>
                            <div className="flex items-center gap-3 mb-3 opacity-80 text-[10px] font-black uppercase tracking-widest">
                               <Sparkles size={16} /> Note pédagogique
                            </div>
                            <p className="text-lg font-bold leading-relaxed italic">"{currentQuestion.explanation}"</p>
                         </Card>
                       )}

                      <Button
                        onClick={handleNext}
                        className="w-full h-20 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-3xl text-xl shadow-2xl shadow-purple-200 transition-all active:scale-95 flex items-center justify-center gap-3"
                      >
                        {currentIdx < totalQuestions - 1 ? "QUESTION SUIVANTE" : "VOIR MON RÉSULTAT"}
                        <ArrowRight size={24} />
                      </Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    );
  }

  return null;
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-zinc-50"><Loader2 className="animate-spin text-purple-600" size={48} /></div>}>
      <PracticeContent />
    </Suspense>
  );
}
