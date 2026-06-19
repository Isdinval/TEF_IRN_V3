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
  Calendar,
  GraduationCap,
  Trophy,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParcours } from '@/contexts/ParcoursContext';

// --- Types ---
interface Question {
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
const LEVELS = ['A1', 'A2', 'B1', 'B2'];

function PracticeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const { activeParcours, nextLesson } = useParcours();

  // --- States ---
  const [mode, setMode] = useState<"selection" | "practice" | "finished">("selection");
  const [isLoading, setIsLoading] = useState(false);

  // Exercise state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
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

  // --- Initialization ---
  useEffect(() => {
    const lessonId = searchParams.get('lessonId');
    const topic = searchParams.get('topic');
    const level = searchParams.get('level');
    const isReviewMode = searchParams.get('mode') === 'review';

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

  const fetchFromLesson = async (lid: string) => {
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
  };

  const autoStart = async (t: string, lvl?: string) => {
    setIsLoading(true);
    setScore(0);
    setCurrentIdx(0);
    setSelected(null);
    setIsChecked(false);

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
      .limit(5);

    if (data && data.length > 0) {
      const allQs = (data as ExerciseDB[])
        .flatMap(mapExerciseToQuestions)
        .sort(() => Math.random() - 0.5);
      setQuestions(allQs.slice(0, 10));
      setMode("practice");
    }
    setIsLoading(false);
  };

  const startCustomExercise = async () => {
    setIsLoading(true);
    let query = supabase.from('exercises').select('*').eq('type', 'qcm');

    if (selectedLevels.length > 0) {
      query = query.in('level', selectedLevels);
    }

    if (selectedCategory !== "Toutes") {
      query = query.ilike('category', `%${selectedCategory}%`);
    }

    const { data } = await query.limit(10);

    if (data && data.length > 0) {
      const allQs = (data as ExerciseDB[]).flatMap(mapExerciseToQuestions);
      setQuestions(allQs.slice(0, 15));
      setCurrentIdx(0);
      setScore(0);
      setSelected(null);
      setIsChecked(false);
      setMode("practice");
    }
    setIsLoading(false);
  };

  // --- Actions ---
  const handleCheck = () => {
    if (selected === null) return;
    setIsChecked(true);
    if (selected === questions[currentIdx].correctAnswer) {
      setScore((s: number) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
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

  // SCREEN: SELECTION
  if (mode === "selection") {
    return (
      <div className="min-h-screen bg-zinc-50/50 p-6 pt-16 lg:p-16">
        <div className="max-w-6xl mx-auto w-full">
          <header className="mb-12">
            <Badge className="bg-rose-600 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-4 shadow-lg shadow-rose-100 border-none">
              Module QCM
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter mb-6 uppercase">
              CENTRE <span className="text-rose-600">D'ENTRAÎNEMENT</span>
            </h1>
            <p className="max-w-2xl text-xl font-medium text-slate-500 leading-relaxed italic">
              Pratiquez la grammaire, la conjugaison et le vocabulaire du TEF IRN.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Design identique à grammar-check */}
            <Card className="lg:col-span-2 p-8 rounded-[2.5rem] border-none bg-white shadow-xl shadow-zinc-200/50 space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <Target size={16} /> Niveau CECRL
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {LEVELS.map((l: string) => (
                    <button
                      key={l}
                      onClick={() => toggleLevel(l)}
                      className={`h-12 rounded-xl font-black text-sm transition-all ${selectedLevels.includes(l) ? 'bg-rose-600 text-white shadow-lg shadow-rose-100' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <Sparkles size={16} /> Thématique
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {CATEGORIES.map((c: string) => (
                    <button
                      key={c}
                      onClick={() => setSelectedCategory(c)}
                      className={`h-12 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${selectedCategory === c ? 'bg-rose-600 text-white shadow-lg shadow-rose-100' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="p-8 rounded-[2.5rem] border-none bg-rose-600 text-white shadow-xl shadow-rose-200/50 flex flex-col justify-center relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4 opacity-80">
                    <Zap size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Mode Classique</span>
                  </div>
                  <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">Prêt à pratiquer ?</h3>
                  <p className="text-sm font-medium opacity-80 mb-6 italic">
                    Une session de 10-15 QCM basés sur vos critères.
                  </p>
                  <Button
                    onClick={startCustomExercise}
                    disabled={selectedLevels.length === 0}
                    className="w-full h-14 bg-white text-rose-600 hover:bg-zinc-100 font-black rounded-xl shadow-lg"
                  >
                    LANCER L'EXERCICE
                  </Button>
                </div>
                <Sparkles className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 rotate-12" />
              </Card>

              {/* SRS Card */}
              <Card
                className="group p-8 rounded-[2.5rem] border-none shadow-xl shadow-zinc-200/50 bg-white relative overflow-hidden cursor-pointer hover:shadow-2xl transition-all"
                onClick={fetchReviewExercises}
              >
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                    <Zap size={28} />
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 mb-2 uppercase tracking-tight leading-none">Révision Intelligente</h3>
                  <p className="text-zinc-500 text-xs font-medium leading-relaxed italic mb-6">
                    L'IA sélectionne les notions où vous avez le plus de difficultés.
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-black text-rose-600 uppercase tracking-widest">
                    Lancer le mode SRS <ArrowRight size={14} />
                  </div>
                </div>
                <Sparkles className="absolute -bottom-4 -right-4 w-24 h-24 text-zinc-50 rotate-12 group-hover:text-rose-50 transition-colors" />
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
            </div>
          </div>
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
        {/* Exercise Header */}
        <header className="bg-white border-b border-zinc-100 px-6 py-6 lg:px-12 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setMode("selection")}
                className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-all group"
              >
                <ArrowRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={24} />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Badge className="bg-rose-600 rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none text-white shadow-lg shadow-rose-100">
                    {currentQuestion?.level}
                  </Badge>
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">
                    {currentQuestion?.category}
                  </span>
                </div>
                <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                  Question <span className="text-rose-600">{currentIdx + 1}</span> / {totalQuestions}
                </h2>
              </div>
            </div>

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
                      className="h-full bg-rose-600 shadow-lg shadow-rose-200"
                    />
                 </div>
                 <div className="flex justify-between text-[8px] font-black text-zinc-300 uppercase tracking-widest">
                    <span>DÉBUT</span>
                    <span>{Math.round(progress)}%</span>
                    <span>FIN</span>
                 </div>
              </div>
            </div>
          </div>
        </header>

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
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-rose-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-rose-200 rotate-3 group">
                      <Target size={32} className="group-hover:scale-110 transition-transform" />
                   </div>

                   <h3 className="text-4xl lg:text-5xl font-black text-zinc-900 leading-tight tracking-tight mt-6">
                    {currentQuestion?.text}
                  </h3>
                  <div className="absolute top-0 right-0 w-80 h-80 bg-rose-50 rounded-full -mr-40 -mt-40 blur-3xl opacity-30" />
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
                      else if (isSelected) buttonStyle = "border-rose-500 bg-rose-50 text-rose-800 shadow-none ring-4 ring-rose-500/10";
                    } else if (isSelected) {
                      buttonStyle = "border-rose-600 bg-rose-50 text-rose-900 shadow-xl ring-4 ring-rose-600/5";
                    }

                    return (
                      <button
                        key={i}
                        disabled={isChecked}
                        onClick={() => setSelected(i)}
                        className={`
                          relative group w-full p-10 rounded-[2.5rem] border-4 text-left transition-all flex justify-between items-center font-black text-2xl
                          active:scale-[0.98]
                          ${buttonStyle}
                        `}
                      >
                        <span className="relative z-10">{option}</span>
                        <div className="flex items-center gap-4">
                           {isChecked && isCorrect && <CheckCircle2 className="text-emerald-500 animate-in zoom-in duration-300" size={32} />}
                           {isChecked && isSelected && !isCorrect && <XCircle className="text-rose-500 animate-in zoom-in duration-300" size={32} />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Card */}
                <AnimatePresence>
                  {isChecked && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-4"
                    >
                      <Card className={`p-8 rounded-[2.5rem] border-none shadow-xl ${selected === currentQuestion.correctAnswer ? "bg-emerald-600 text-white" : "bg-zinc-900 text-white"}`}>
                        <div className="flex items-center gap-3 mb-3 opacity-80 text-[10px] font-black uppercase tracking-widest">
                          <Sparkles size={16} /> Explication Pédagogique
                        </div>
                        <p className="text-lg font-bold leading-relaxed italic">
                          {currentQuestion.explanation || (selected === currentQuestion.correctAnswer ? "Bravo ! C'est la bonne réponse." : "Oups ! Regardez la correction.")}
                        </p>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Footer (Exercise) */}
                <div className="flex justify-center pt-10">
                  {!isChecked ? (
                    <Button
                      disabled={selected === null}
                      onClick={handleCheck}
                      className="w-full max-w-md h-24 bg-zinc-900 hover:bg-black text-white font-black rounded-[2.5rem] text-2xl shadow-2xl shadow-zinc-200 transition-all active:scale-95 disabled:opacity-30 flex gap-4"
                    >
                      VÉRIFIER LA RÉPONSE <CheckCircle2 size={28} />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      className="w-full max-w-md h-24 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-[2.5rem] text-2xl shadow-2xl shadow-rose-200 transition-all active:scale-95 flex items-center justify-center gap-4 group"
                    >
                      {currentIdx < totalQuestions - 1 ? "QUESTION SUIVANTE" : "VOIR MON RÉSULTAT"}
                      <ArrowRight size={32} className="group-hover:translate-x-2 transition-transform" />
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    );
  }

  // SCREEN: FINISHED
  if (mode === "finished") {
    const totalQuestions = questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    return (
      <div className="flex items-center justify-center min-h-screen p-8 bg-zinc-50 overflow-hidden relative">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
           <motion.div
             animate={{ rotate: 360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
             className="absolute -top-1/4 -left-1/4 w-[1000px] h-[1000px] bg-rose-50/50 rounded-full blur-[120px]"
           />
           <motion.div
             animate={{ rotate: -360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
             className="absolute -bottom-1/4 -right-1/4 w-[800px] h-[800px] bg-indigo-50/50 rounded-full blur-[100px]"
           />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-2xl relative z-10"
        >
          <Card className="text-center p-16 rounded-[5rem] shadow-2xl shadow-rose-200/40 border-none bg-white relative overflow-hidden ring-1 ring-zinc-100">
            <motion.div
               initial={{ rotate: -15, scale: 0 }}
               animate={{ rotate: 0, scale: 1 }}
               transition={{ type: "spring", delay: 0.2 }}
               className="w-32 h-32 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 relative z-10 shadow-2xl shadow-emerald-200"
            >
              <Trophy className="text-white" size={64} />
            </motion.div>

            <h1 className="text-5xl lg:text-6xl font-black mb-4 tracking-tighter uppercase relative z-10 text-zinc-900 leading-none">Bravo !</h1>
            <p className="text-zinc-400 mb-12 font-bold text-xl relative z-10 leading-relaxed max-w-md mx-auto">
              Vous avez complété votre session d'entraînement avec brio.
            </p>

            <div className="relative mb-16 z-10 group">
               <motion.div
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                 className="text-[12rem] font-black text-rose-600 tracking-tighter leading-none select-none group-hover:scale-105 transition-transform"
               >
                {percentage}
              </motion.div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-12">
                 <p className="text-xs font-black uppercase tracking-[0.6em] text-rose-300 whitespace-nowrap">SCORE DE MAÎTRISE</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-12 relative z-10">
               <div className="bg-zinc-50 p-10 rounded-[3rem] border-2 border-zinc-100 group hover:border-zinc-300 transition-colors">
                  <div className="text-zinc-400 text-[11px] font-black uppercase mb-2 tracking-[0.3em]">RÉPONSES</div>
                  <div className="text-4xl font-black text-zinc-900">{score} <span className="text-zinc-300">/ {totalQuestions}</span></div>
               </div>
               <div className="bg-rose-600 p-10 rounded-[3rem] shadow-2xl shadow-rose-200">
                  <div className="text-rose-200 text-[11px] font-black uppercase mb-2 tracking-[0.3em]">XP GAGNÉS</div>
                  <div className="text-4xl font-black text-white">+{percentage}</div>
               </div>
            </div>

            <div className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-16 text-zinc-900 border-2 border-zinc-100 hover:bg-zinc-50 font-black rounded-2xl text-lg transition-all active:scale-95 flex gap-3 uppercase tracking-widest"
                  onClick={() => {
                    setScore(0);
                    setCurrentIdx(0);
                    setSelected(null);
                    setIsChecked(false);
                    setMode("practice");
                  }}
                >
                  <RotateCcw size={20} /> Recommencer
                </Button>
                <Button
                  variant="ghost"
                  className="h-16 text-zinc-400 hover:text-rose-600 font-black rounded-2xl text-lg transition-all active:scale-95 flex gap-3 uppercase tracking-widest"
                  onClick={() => setMode("selection")}
                >
                  Sélection <ArrowRight size={20} />
                </Button>
              </div>
              {activeParcours && (
                <Button
                  className="w-full h-20 bg-zinc-900 hover:bg-black text-white font-black rounded-[2.5rem] text-2xl shadow-2xl shadow-zinc-300 transition-all active:scale-95 flex gap-4"
                  onClick={() => nextLesson()}
                >
                  CONTINUER MON PARCOURS <GraduationCap size={28} />
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

            <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-zinc-50"><Loader2 className="animate-spin text-rose-600" size={48} /></div>}>
      <PracticeContent />
    </Suspense>
  );
}
