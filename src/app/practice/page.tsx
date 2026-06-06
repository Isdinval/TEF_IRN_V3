"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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

export default function Practice() {
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

  const categories = ["Grammaire", "Conjugaison", "Syntaxe", "Orthographe"];
  const levels = ["A1", "A2", "B1", "B2"];

  const startTraining = async (review: boolean = false) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase.from('exercises').select('*').eq('type', 'qcm_centre_entrainement');

    if (review && user) {
      const { data: reviews } = await supabase
        .from('user_reviews')
        .select('exercise_id')
        .eq('user_id', user.id)
        .lte('next_review_at', new Date().toISOString());

      const ids = reviews?.map((r: any) => r.exercise_id) || [];
      if (ids.length === 0) {
        alert("Bravo ! Vous n'avez aucune révision urgente.");
        setLoading(false);
        return;
      }
      query = query.in('id', ids);
      setIsReviewMode(true);
    } else {
      query = query.eq('level', filters.level).eq('category', filters.category);
      setIsReviewMode(false);
    }

    const { data, error } = await query.limit(1);

    if (error) {
      console.error(error);
      alert("Erreur lors du chargement.");
    } else if (data && data.length > 0) {
      const ex = data[0] as Exercise;
      setExercise(ex);
      setMode("training");
      setCurrentQuestionIndex(0);
      setScore(0);
      setIsFinished(false);
      setSelected(null);
      setIsChecked(false);
    } else {
      alert("Aucun exercice trouvé pour ce niveau et cette catégorie.");
    }
    setLoading(false);
  };

  const handleCheck = () => {
    if (!exercise) return;
    const correctAnswer = exercise.content.correct_answers[currentQuestionIndex];

    if (selected === correctAnswer) {
      setScore(prev => prev + 1);
    }
    setIsChecked(true);
  };

  const handleNext = async () => {
    if (!exercise) return;
    const totalQuestions = exercise.content.questions.length;

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelected(null);
      setIsChecked(false);
    } else {
      // Finished exercise
      await saveExerciseProgress();
      setIsFinished(true);
    }
  };

  const saveExerciseProgress = async () => {
    if (!exercise) return;
    const total = exercise.content.questions.length;
    const percentage = Math.round((score / total) * 100);

    try {
      await fetch('/api/exercise-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId: exercise.id,
          score: percentage,
          answers: { correct: score, total: total }
        })
      });
    } catch (err) {
      console.error("Error saving score:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="text-zinc-500 font-bold animate-pulse">Préparation de votre exercice...</p>
      </div>
    );
  }

  if (mode === "selection") {
    return (
      <div className="max-w-5xl mx-auto p-8 pt-16 min-h-screen">
        <header className="mb-12">
          <Badge className="bg-indigo-600 mb-4 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-none shadow-lg shadow-indigo-100">
            Centre d'Entraînement
          </Badge>
          <h1 className="text-5xl font-black text-zinc-900 tracking-tighter mb-4">
            QCM GRAMMAIRE <span className="text-indigo-600">&</span> VOCAB
          </h1>
          <p className="text-zinc-500 text-lg font-medium max-w-2xl">
            Pratiquez les règles de la langue française avec nos exercices interactifs de type Voltaire.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="md:col-span-2 border-none shadow-2xl shadow-zinc-200/50 rounded-[3rem] p-10 bg-white">
            <div className="space-y-10">
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <GraduationCap size={24} />
                  </div>
                  <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Choisir mon niveau</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {levels.map((l) => (
                    <button
                      key={l}
                      onClick={() => setFilters({ ...filters, level: l })}
                      className={`
                        h-20 rounded-2xl border-2 font-black text-xl transition-all
                        ${filters.level === l ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-inner' : 'border-zinc-100 hover:border-zinc-300 text-zinc-400'}
                      `}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    <LayoutGrid size={24} />
                  </div>
                  <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Catégorie</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setFilters({ ...filters, category: c })}
                      className={`
                        p-6 rounded-2xl border-2 text-left font-bold transition-all flex items-center justify-between
                        ${filters.category === c ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-zinc-100 hover:border-zinc-300 text-zinc-500'}
                      `}
                    >
                      {c}
                      {filters.category === c && <div className="w-2 h-2 bg-indigo-600 rounded-full" />}
                    </button>
                  ))}
                </div>
              </section>

              <Button
                onClick={() => startTraining(false)}
                className="w-full h-20 bg-zinc-900 hover:bg-zinc-800 text-white rounded-[2rem] text-2xl font-black shadow-2xl shadow-zinc-300 transition-all active:scale-[0.98]"
              >
                COMMENCER L'EXERCICE
              </Button>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-2xl shadow-indigo-100 rounded-[2.5rem] p-8 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white relative overflow-hidden">
               <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                    <Brain size={28} />
                  </div>
                  <h3 className="text-2xl font-black mb-2 tracking-tight">Révision urgente</h3>
                  <p className="text-indigo-100 text-sm font-medium mb-8 leading-relaxed">
                    Notre algorithme a identifié des points faibles. Révisez-les maintenant pour ne pas oublier.
                  </p>
                  <Button
                    onClick={() => startTraining(true)}
                    className="w-full h-14 bg-white text-indigo-600 hover:bg-indigo-50 font-black rounded-xl shadow-xl border-none"
                  >
                    Réviser mon SRS
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
                   Un exercice est composé de 5 questions. Lisez attentivement et choisissez la bonne option.
                 </p>
                 <div className="h-px bg-zinc-200 w-full" />
                 <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase">
                    <Target size={14} className="text-indigo-600" /> Objectif : 80% de réussite
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
          <Card className="text-center p-12 rounded-[4rem] shadow-2xl shadow-indigo-100 border-none bg-white">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="text-green-600" size={48} />
            </div>
            <h1 className="text-4xl font-black mb-4 tracking-tighter">Exercice Terminé !</h1>
            <p className="text-zinc-400 mb-10 font-bold text-lg">
              Tu as répondu correctement à <span className="text-zinc-900">{score}</span> questions sur <span className="text-zinc-900">{totalQuestions}</span>.
            </p>

            <div className="relative mb-12">
               <div className="text-8xl font-black text-indigo-600 tracking-tighter">
                {percentage}%
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300 mt-2">Score de maîtrise</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-10">
               <div className="bg-zinc-50 p-6 rounded-3xl">
                  <div className="text-zinc-400 text-[10px] font-black uppercase mb-1">XP GAGNÉS</div>
                  <div className="text-2xl font-black text-zinc-900">+{percentage}</div>
               </div>
               <div className="bg-zinc-50 p-6 rounded-3xl">
                  <div className="text-zinc-400 text-[10px] font-black uppercase mb-1">DASHBOARD</div>
                  <div className="text-xs font-black text-indigo-600 uppercase">Mise à jour OK</div>
               </div>
            </div>

            <Button
              className="w-full h-20 bg-zinc-900 hover:bg-zinc-800 text-white font-black rounded-3xl text-xl shadow-2xl shadow-zinc-200 transition-all"
              onClick={() => setMode("selection")}
            >
              Retour à la sélection
            </Button>
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
            onClick={() => setMode("selection")}
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-900 transition-colors font-bold text-sm mb-4"
          >
            <ChevronLeft size={16} /> Quitter
          </button>
          <div className="flex items-center gap-3">
            <Badge className="bg-indigo-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 border-none">
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
                  className="h-full bg-indigo-600"
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
               <Target className="absolute -top-6 left-1/2 -translate-x-1/2 text-indigo-600 bg-white w-12 h-12 p-2 rounded-2xl shadow-lg border-2 border-zinc-100" />
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
                    ${selected === i ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-lg' : 'border-zinc-50 bg-white text-zinc-500 hover:border-zinc-200 shadow-sm'}
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
            className="h-16 px-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 flex gap-2 text-lg transition-all active:scale-95"
          >
            {currentQuestionIndex < totalQuestions - 1 ? "Question suivante" : "Terminer l'exercice"} <ArrowRight size={24} />
          </Button>
        )}
      </footer>
    </div>
  );
}
