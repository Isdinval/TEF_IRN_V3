"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import ExerciseCard from "@/app/parcours/[id]/components/ExerciseCard";
import { Exercise } from "@/lib/parcours";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight, Loader2, Target, Sparkles, GraduationCap, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useParcours } from "@/contexts/ParcoursContext";

export function PracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeParcours } = useParcours();

  const [mode, setMode] = useState<"selection" | "practice" | "summary">("selection");
  const [catalogue, setCatalogue] = useState<Exercise[]>([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("A2");
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const fetchExercises = async () => {
      setLoadingCatalogue(true);
      let query = supabase
        .from('exercises')
        .select('*, exercise_attempts(success_rate)')
        .eq('type', 'qcm')
        .eq('level', selectedLevel);

      if (selectedCategory !== "Toutes") {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (!error && data) {
        const formatted = data.map((ex: any) => ({
          ...ex,
          is_completed: ex.exercise_attempts?.some((a: any) => a.success_rate >= 80)
        }));
        setCatalogue(formatted);
      }
      setLoadingCatalogue(false);
    };

    fetchExercises();
  }, [selectedLevel, selectedCategory]);

  const startExercise = async (ex: Exercise) => {
    const { data, error } = await supabase
      .from('exercises')
      .select('content')
      .eq('id', ex.id)
      .single();

    if (!error && data?.content?.questions) {
      setQuestions(data.content.questions);
      setMode("practice");
      setCurrentIdx(0);
      setScore(0);
      setSelected(null);
      setIsChecked(false);
    }
  };

  const handleSelect = (idx: number) => {
    if (!isChecked) setSelected(idx);
  };

  const handleCheck = () => {
    if (selected === null) return;
    setIsChecked(true);
    if (selected === questions[currentIdx].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelected(null);
      setIsChecked(false);
    } else {
      setMode("summary");
    }
  };

  if (mode === "selection") {
    const àDécouvrir = catalogue.filter((ex: any) => !ex.is_completed);
    const terminées = catalogue.filter((ex: any) => ex.is_completed);

    const renderExerciseGrid = (title: string, exercises: Exercise[], badgeColor: string) => (
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Badge className={`${badgeColor} text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border-none shadow-lg`}>
            {title}
          </Badge>
          <div className="h-px bg-zinc-100 flex-1" />
          <span className="text-xs font-black text-zinc-300 uppercase tracking-widest">{exercises.length} exercice{exercises.length > 1 ? 's' : ''}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map((ex: Exercise) => (
            <div key={ex.id} onClick={() => startExercise(ex)} className="cursor-pointer">
              <ExerciseCard exercise={ex} />
            </div>
          ))}
        </div>
      </div>
    );

    return (
      <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-8 pt-16">
        <header className="mb-12">
          <Badge className="bg-rose-600 mb-4 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-none shadow-lg shadow-rose-100 text-white">
            Centre d'entraînement
          </Badge>
          <h1 className="text-5xl font-black text-zinc-900 tracking-tighter mb-4">
            ENTRAÎNEMENT <span className="text-rose-600">QCM</span>
          </h1>
          <p className="text-zinc-500 text-lg font-medium max-w-2xl">
            Validez vos acquis avec nos questionnaires à choix multiples conçus pour l'examen TEF IRN.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <Card className="md:col-span-3 border-none shadow-2xl shadow-zinc-200/50 rounded-[3rem] p-10 bg-zinc-50/50">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <GraduationCap className="text-rose-600" size={20} />
                    <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Niveau</h3>
                  </div>
                  <div className="flex gap-2">
                    {['A1', 'A2', 'B1', 'B2'].map(level => (
                      <button
                        key={level}
                        onClick={() => setSelectedLevel(level)}
                        className={`px-6 py-3 rounded-2xl font-black transition-all ${selectedLevel === level ? 'bg-rose-600 text-white shadow-lg' : 'bg-white text-zinc-400 hover:bg-zinc-100'}`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </section>
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <LayoutGrid className="text-rose-600" size={20} />
                    <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Catégorie</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Toutes', 'Grammaire', 'Conjugaison', 'Syntaxe', 'Vocabulaire'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${selectedCategory === cat ? 'bg-rose-600 text-white shadow-md' : 'bg-white text-zinc-400 hover:bg-zinc-100'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </section>
             </div>
          </Card>

          <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-br from-rose-600 to-orange-500 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Statistiques</div>
                  <div className="text-3xl font-black mb-4 tracking-tighter">{catalogue.length}</div>
                  <p className="text-xs font-medium opacity-80 leading-relaxed italic">
                    Exercices disponibles pour votre sélection actuelle.
                  </p>
               </div>
               <Target className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10 rotate-12 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>

        <section className="mt-12">
          {loadingCatalogue ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i: number) => (
                <div key={i} className="h-64 rounded-[2rem] bg-zinc-100 animate-pulse" />
              ))}
            </div>
          ) : catalogue.length > 0 ? (
            <>
              {renderExerciseGrid("À découvrir", àDécouvrir, "bg-rose-600")}
              {renderExerciseGrid("Terminées", terminées, "bg-emerald-500")}
            </>
          ) : (
            <Card className="border-dashed border-2 border-zinc-200 rounded-[2rem] p-12 text-center bg-zinc-50/50">
              <Target className="mx-auto mb-4 text-zinc-300" size={40} />
              <p className="font-bold text-zinc-500">Aucun exercice trouvé pour cette sélection.</p>
            </Card>
          )}
        </section>
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
                    {currentQuestion?.level}</Badge> {currentQuestion?.difficulty && <Badge variant="outline" className="rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-zinc-200 text-zinc-500 bg-white ml-2">{currentQuestion.difficulty}</Badge>}
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

                   <h3 className="text-[clamp(1.5rem,3vw+1rem,2.25rem)] font-black text-zinc-900 leading-tight tracking-tight mt-6">
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
                      <motion.button
                        key={i}
                        whileHover={!isChecked ? { x: 5 } : {}}
                        whileTap={!isChecked ? { scale: 0.98 } : {}}
                        onClick={() => handleSelect(i)}
                        className={`w-full p-6 lg:p-8 rounded-3xl border-2 transition-all text-left font-bold text-lg flex items-center justify-between group ${buttonStyle}`}
                        disabled={isChecked}
                      >
                        <div className="flex items-center gap-6">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-colors ${isSelected ? 'bg-rose-600 text-white' : 'bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200'}`}>
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
                        className="w-full h-20 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-3xl text-xl shadow-2xl shadow-rose-200 transition-all active:scale-95 flex items-center justify-center gap-3"
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-zinc-50"><Loader2 className="animate-spin text-rose-600" size={48} /></div>}>
      <PracticeContent />
    </Suspense>
  );
}
