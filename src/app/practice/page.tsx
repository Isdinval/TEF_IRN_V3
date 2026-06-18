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
  Activity,
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
  const [isSaving, setIsSaving] = useState(false);

  // Exercise state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);

  // Selection state
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['A2']);
  const [selectedCategory, setSelectedCategory] = useState<string>("Toutes");

  const id = searchParams.get('id');
  const lessonId = searchParams.get('lessonId');
  const topic = searchParams.get('topic');
  const level = searchParams.get('level');
  const isReviewMode = searchParams.get('mode') === 'review';

  const mapExerciseToQuestions = (ex: ExerciseDB): Question[] => {
    return ex.content.questions.map((q, idx) => ({
      id: `${ex.id}-${idx}`,
      text: q,
      options: ex.content.options[idx],
      correctAnswer: ex.content.correct_answers[idx],
      level: ex.level,
      category: ex.category,
      instructions: ex.instructions,
      explanation: ex.content.explanations?.[idx]
    }));
  };

  // --- Initialization ---
  useEffect(() => {
    const init = async () => {
      if (id) {
        await fetchExerciseById(id);
      } else if (lessonId && !topic) {
        await fetchFromLesson(lessonId);
      } else if (topic) {
        await autoStart(topic, level || undefined);
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
  };

  const fetchFromLesson = async (lid: string) => {
    setIsLoading(true);
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
    let query = supabase.from('exercises').select('*').eq('type', 'qcm');
    if (lvl) query = query.eq('level', lvl);
    query = query.ilike('category', `%${t}%`);

    const { data } = await query.limit(5);
    if (data && data.length > 0) {
      const allQs = (data as ExerciseDB[]).flatMap(mapExerciseToQuestions);
      setQuestions(allQs.slice(0, 10));
      setMode("practice");
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
    if (selectedLevels.length > 0) query = query.in('level', selectedLevels);
    if (selectedCategory !== "Toutes") query = query.ilike('category', `%${selectedCategory}%`);

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

  const handleCheck = () => {
    if (selected === null) return;
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
      setIsSaving(true);
      await saveResult();
      setMode("finished");
      setIsSaving(false);
    }
  };

  const saveResult = async () => {
    const total = questions.length || 1;
    const finalScore = Math.round((score / total) * 100);
    const { data: { user } } = await supabase.auth.getUser();

    if (user && questions.length > 0) {
      try {
        const exId = questions[0].id.split('-')[0];
        await fetch('/api/exercise-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exerciseId: exId,
            score: finalScore,
            answers: { correct: score, total }
          })
        });
      } catch (err) {
        console.error("Error saving result:", err);
      }
    }
  };

  const toggleLevel = (lvl: string) => {
    setSelectedLevels(prev => prev.includes(lvl) ? prev.filter(l => l !== lvl) : [...prev, lvl]);
  };

  if (isLoading || isSaving) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-zinc-50">
        <Loader2 className="h-12 w-12 animate-spin text-rose-600" />
        <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
          {isSaving ? "Enregistrement..." : "Chargement..."}
        </p>
      </div>
    );
  }

  if (mode === "selection") {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col p-6 lg:p-12 overflow-x-hidden">
        <div className="max-w-6xl mx-auto w-full">
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-lg">
                <Activity size={24} />
              </div>
              <h1 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase">Centre d'Entraînement QCM</h1>
            </div>
            <p className="text-zinc-500 font-medium italic">Pratiquez la grammaire, la conjugaison et le vocabulaire du TEF IRN.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 p-8 rounded-[2.5rem] border-none bg-white shadow-xl space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <Target size={16} /> Niveau CECRL
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {LEVELS.map(l => (
                    <button
                      key={l}
                      onClick={() => toggleLevel(l)}
                      className={`h-12 rounded-xl font-black text-sm transition-all ${selectedLevels.includes(l) ? 'bg-rose-600 text-white' : 'bg-zinc-50 text-zinc-400'}`}
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
                  {CATEGORIES.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedCategory(c)}
                      className={`h-12 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${selectedCategory === c ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-zinc-400'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="p-8 rounded-[2.5rem] border-none bg-rose-600 text-white shadow-xl flex flex-col justify-center">
                <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">Prêt à pratiquer ?</h3>
                <p className="text-sm font-medium opacity-80 mb-6 italic">Une session de QCM basés sur vos critères.</p>
                <Button onClick={startCustomExercise} disabled={selectedLevels.length === 0} className="w-full h-14 bg-white text-rose-600 hover:bg-zinc-100 font-black rounded-xl">
                  LANCER L'EXERCICE
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "finished") {
    const totalQuestions = questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    return (
      <div className="flex items-center justify-center min-h-screen p-8 bg-zinc-50">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl w-full text-center">
          <Card className="p-16 rounded-[4rem] border-none bg-white shadow-2xl relative">
            <h1 className="text-5xl font-black text-zinc-900 tracking-tighter uppercase mb-4">BRAVO !</h1>
            <div className="text-[10rem] font-black text-rose-600 tracking-tighter leading-none mb-8">{percentage}%</div>
            <div className="grid grid-cols-2 gap-6 mb-12">
               <div className="bg-zinc-50 p-10 rounded-[3rem] border-2 border-zinc-100">
                  <div className="text-zinc-400 text-[11px] font-black uppercase mb-2">RÉPONSES</div>
                  <div className="text-4xl font-black text-zinc-900">{score} / {totalQuestions}</div>
               </div>
               <div className="bg-rose-600 p-10 rounded-[3rem] text-white">
                  <div className="text-rose-200 text-[11px] font-black uppercase mb-2">XP GAGNÉS</div>
                  <div className="text-4xl font-black">+{percentage}</div>
               </div>
            </div>
            <Button onClick={() => setMode("selection")} className="w-full h-20 bg-zinc-900 hover:bg-black text-white font-black rounded-[2.5rem] text-2xl uppercase">
              Terminer
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <div className="max-w-3xl mx-auto p-8 pt-16 min-h-screen flex flex-col">
      <header className="mb-12 flex justify-between items-end">
        <div className="space-y-2">
          <button onClick={() => setMode("selection")} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-900 font-bold text-sm mb-4">
            <ChevronLeft size={16} /> Quitter
          </button>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">
            {currentQuestion?.instructions || "Répondez à la question"}
          </h2>
        </div>
        <div className="flex flex-col items-end gap-3">
            <div className="text-xs font-black text-zinc-400 uppercase tracking-widest bg-zinc-100 px-4 py-2 rounded-full">
              Question {currentIdx + 1} / {questions.length}
            </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center mb-12">
        <AnimatePresence mode="wait">
          <motion.div key={currentIdx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
            <div className="p-12 bg-white border-2 border-zinc-100 shadow-2xl rounded-[4rem] text-4xl text-center font-black text-zinc-900 relative">
               <Target className="absolute -top-6 left-1/2 -translate-x-1/2 text-rose-600 bg-white w-12 h-12 p-2 rounded-2xl border-2" />
              {currentQuestion?.text}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {currentQuestion?.options.map((option, i) => (
                <button
                  key={i}
                  disabled={isChecked}
                  onClick={() => setSelected(i)}
                  className={`
                    w-full p-8 rounded-3xl border-2 text-left transition-all flex justify-between items-center font-black text-xl
                    ${selected === i ? 'border-rose-600 bg-rose-50 text-rose-900 shadow-lg' : 'border-zinc-50 bg-white text-zinc-500 hover:border-zinc-200'}
                    ${isChecked && i === currentQuestion.correctAnswer ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : ''}
                    ${isChecked && selected === i && i !== currentQuestion.correctAnswer ? 'border-rose-500 bg-rose-50 text-rose-900' : ''}
                  `}
                >
                  <span>{option}</span>
                  {isChecked && i === currentQuestion.correctAnswer && <CheckCircle2 className="text-emerald-500" size={28} />}
                  {isChecked && selected === i && i !== currentQuestion.correctAnswer && <XCircle className="text-rose-500" size={28} />}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="flex justify-between items-center p-6 bg-white border border-zinc-100 rounded-[2.5rem] shadow-xl mb-8">
        <div className="text-xl font-black text-zinc-900">{score} / {questions.length}</div>
        {!isChecked ? (
          <Button disabled={selected === null} onClick={handleCheck} className="h-16 px-12 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-2xl text-lg">
            Vérifier
          </Button>
        ) : (
          <Button onClick={handleNext} className="h-16 px-12 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl flex gap-2 text-lg">
            {currentIdx < questions.length - 1 ? "Suivant" : "Terminer"} <ArrowRight size={24} />
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
