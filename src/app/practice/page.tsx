"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useParcours } from "@/contexts/ParcoursContext";
import { BreadcrumbParcours } from "@/components/shared/BreadcrumbParcours";
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
  Target,
  X
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
  const { activeParcours } = useParcours();

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const lessonId = searchParams.get('lessonId');
    const topic = searchParams.get('topic');
    const level = searchParams.get('level');

    if (lessonId && topic) {
      autoStart(lessonId, topic, level || undefined);
    } else if (activeParcours && mode === "selection") {
      setFilters({ level: activeParcours.level, category: activeParcours.category });
    }
  }, [searchParams, activeParcours]);

  const autoStart = async (lessonId: string, topic: string, level?: string) => {
    setLoading(true);
    // On essaie de trouver un exercice spécifique à la leçon
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

  const startTraining = async (review = false) => {
    setLoading(true);
    setIsReviewMode(review);

    if (review) {
      const { data: reviewExo } = await supabase
        .from('exercises')
        .select('*')
        .eq('type', 'qcm_centre_entrainement')
        .limit(1)
        .single();

      if (reviewExo) setExercise(reviewExo as Exercise);
    } else {
      const { data: normalExo } = await supabase
        .from('exercises')
        .select('*')
        .eq('level', filters.level)
        .eq('category', filters.category)
        .eq('type', 'qcm_centre_entrainement')
        .limit(1)
        .maybeSingle();

      if (normalExo) setExercise(normalExo as Exercise);
    }

    setMode("training");
    setCurrentQuestionIndex(0);
    setScore(0);
    setIsFinished(false);
    setLoading(false);
  };

  const handleCheck = () => {
    if (selected === null || !exercise) return;
    const correct = exercise.content.correct_answers[currentQuestionIndex];
    if (selected === correct) setScore(s => s + 1);
    setIsChecked(true);
  };

  const handleNext = async () => {
    if (currentQuestionIndex < (exercise?.content.questions.length || 5) - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelected(null);
      setIsChecked(false);
    } else {
      setIsFinished(true);
      // Update XP and practice status
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Record attempt
        await supabase.from('exercise_attempts').insert({
          user_id: user.id,
          exercise_id: exercise?.id,
          score: Math.round((score / (exercise?.content.questions.length || 5)) * 100),
          is_completed: true
        });

        // Update profile XP
        const xpToAdd = Math.round((score / (exercise?.content.questions.length || 5)) * 100);
        const { data: profile } = await supabase.from('profiles').select('total_xp').eq('id', user.id).single();
        await supabase.from('profiles').update({
          total_xp: (profile?.total_xp || 0) + xpToAdd,
          last_activity_at: new Date().toISOString()
        }).eq('id', user.id);

        // Update last_practice_at in user_parcours_progress if in parcours mode
        if (activeParcours) {
          await supabase.from('user_parcours_progress')
            .update({ last_practice_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('parcours_id', activeParcours.id);
        }
      }
    }
  };

  if (mode === "selection") {
    return (
      <div className="max-w-6xl mx-auto p-8 pt-16 min-h-screen">
        <BreadcrumbParcours />
        <header className="mb-16 space-y-4">
          <div className="flex items-center gap-3">
             <Badge className="bg-indigo-600 rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none">
                Training Center
             </Badge>
             {activeParcours && (
               <Badge variant="outline" className="rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-indigo-200 text-indigo-600 bg-indigo-50 flex items-center gap-2">
                 <Sparkles size={12} /> Contextualisé : {activeParcours.category} {activeParcours.level}
               </Badge>
             )}
          </div>
          <h1 className="text-6xl font-black text-zinc-900 tracking-tighter leading-none">
            QCM Grammaire <br />& Vocabulaire
          </h1>
          <p className="text-xl text-zinc-400 font-medium max-w-2xl leading-relaxed">
            Entraînez-vous sur des points précis pour automatiser vos réflexes et réussir votre examen.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-2xl shadow-zinc-100 rounded-[3rem] p-10 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2">Niveau</label>
                  <div className="flex flex-wrap gap-2">
                    {["A1", "A2", "B1", "B2"].map((l) => (
                      <button
                        key={l}
                        onClick={() => setFilters({ ...filters, level: l })}
                        className={`h-14 flex-1 rounded-2xl font-black text-sm transition-all ${filters.level === l ? 'bg-zinc-900 text-white shadow-xl' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-2">Catégorie</label>
                  <div className="flex flex-wrap gap-2">
                    {["Grammaire", "Conjugaison", "Syntaxe", "Orthographe"].map((c) => (
                      <button
                        key={c}
                        onClick={() => setFilters({ ...filters, category: c })}
                        className={`h-14 flex-1 rounded-2xl font-black text-xs transition-all ${filters.category === c ? 'bg-indigo-600 text-white shadow-xl' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => startTraining()}
                disabled={loading}
                className="w-full h-20 mt-10 bg-zinc-900 hover:bg-black text-white font-black rounded-3xl text-xl shadow-2xl shadow-zinc-200 transition-all hover:scale-[1.01] active:scale-[0.98]"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Commencer l'entraînement"}
                <ArrowRight className="ml-2" />
              </Button>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="relative overflow-hidden border-none shadow-2xl shadow-indigo-100 rounded-[3rem] p-10 bg-indigo-600 text-white">
               <div className="relative z-10">
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

export default function Practice() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>}>
      <PracticeContent />
    </Suspense>
  );
}
