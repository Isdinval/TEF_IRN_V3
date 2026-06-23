"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import ExerciseCard from "@/app/parcours/[id]/components/ExerciseCard";
import { Exercise } from "@/lib/parcours";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight, Loader2, Target, Sparkles, Zap, GraduationCap, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useParcours } from "@/contexts/ParcoursContext";

export function GrammarCheckContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const exerciseId = params?.id as string;
  const { activeParcours } = useParcours();

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [status, setStatus] = useState<"typing" | "correct" | "wrong">("typing");
  const [score, setScore] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [catalogue, setCatalogue] = useState<Exercise[]>([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("A2");
  const [selectedCategory, setSelectedCategory] = useState("Grammaire");

  const supabase = createClient();

  useEffect(() => {
    const fetchExercises = async () => {
      setLoadingCatalogue(true);
      const { data, error } = await supabase
        .from('exercises')
        .select('*, exercise_attempts(success_rate)')
        .eq('type', 'trous')
        .eq('level', selectedLevel)
        .eq('category', selectedCategory);

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

  useEffect(() => {
    if (exerciseId) {
      startExercise(exerciseId);
    }
  }, [exerciseId]);

  const startExercise = async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('exercises')
      .select('content')
      .eq('id', id)
      .single();

    if (!error && data?.content?.questions) {
      setQuestions(data.content.questions);
      setIsStarted(true);
      setCurrentIdx(0);
      setScore(0);
      setStatus("typing");
    }
    setLoading(false);
  };

  const checkCorrection = () => {
    const current = questions[currentIdx];
    const isCorrect = inputValue.trim().toLowerCase() === current.correction.toLowerCase();

    if (isCorrect) {
      setStatus("correct");
      setScore(s => s + 1);
    } else {
      setStatus("wrong");
    }
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setInputValue("");
      setStatus("typing");
    } else {
      // End of exercise logic (redirect or summary)
      if (activeParcours) {
        router.push(`/parcours/${activeParcours.id}/complete?type=grammar-check&score=${score}`);
      } else {
        setIsStarted(false);
      }
    }
  };

  if (!isStarted) {
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
            <ExerciseCard key={ex.id} exercise={ex} />
          ))}
        </div>
      </div>
    );

    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto p-8 pt-16">
          <header className="mb-12">
            <Badge className="bg-indigo-600 mb-4 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-none shadow-lg shadow-indigo-100 text-white">
              Catalogue Grammaire
            </Badge>
            <h1 className="text-5xl font-black text-zinc-900 tracking-tighter mb-4">
              TEXTES À <span className="text-indigo-600">TROUS</span>
            </h1>
            <p className="text-zinc-500 text-lg font-medium max-w-2xl">
              Pratiquez votre grammaire et votre syntaxe en complétant des textes adaptés à votre niveau TEF IRN.
            </p>
          </header>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            <Card className="md:col-span-3 border-none shadow-2xl shadow-zinc-200/50 rounded-[3rem] p-10 bg-zinc-50/50">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <GraduationCap className="text-indigo-600" size={20} />
                      <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Niveau</h3>
                    </div>
                    <div className="flex gap-2">
                      {['A2', 'B1'].map(level => (
                        <button
                          key={level}
                          onClick={() => setSelectedLevel(level)}
                          className={`px-6 py-3 rounded-2xl font-black transition-all ${selectedLevel === level ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-zinc-400 hover:bg-zinc-100'}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </section>
                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <Zap className="text-indigo-600" size={20} />
                      <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Catégorie</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['Grammaire', 'Conjugaison', 'Syntaxe'].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-6 py-3 rounded-2xl font-black transition-all ${selectedCategory === cat ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-zinc-400 hover:bg-zinc-100'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </section>
               </div>
            </Card>

            <div className="flex flex-col gap-6">
              <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                 <div className="relative z-10">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Objectif</div>
                    <div className="text-3xl font-black mb-4 tracking-tighter">80% +</div>
                    <p className="text-xs font-medium opacity-80 leading-relaxed italic">
                      Visez un score minimum de 80% pour valider une leçon dans votre parcours.
                    </p>
                 </div>
                 <Target className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10 rotate-12 group-hover:scale-110 transition-transform" />
              </div>
              <div className="bg-zinc-100 p-8 rounded-[2.5rem] border border-zinc-200/50">
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                    <Calendar size={16} /> Entraînement Quotidien
                 </div>
              </div>
            </div>
          </div>

          {/* Catalogue Section */}
          <section className="mt-12">
            {loadingCatalogue ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i: number) => (
                  <div key={i} className="h-64 rounded-[2rem] bg-zinc-100 animate-pulse" />
                ))}
              </div>
            ) : catalogue.length > 0 ? (
              <>
                {renderExerciseGrid("À découvrir", àDécouvrir, "bg-indigo-600")}
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

  const current = questions[currentIdx];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <header className="bg-white border-b border-zinc-100 px-6 py-6 lg:px-12">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                if (activeParcours) {
                  router.push(`/parcours/${activeParcours.id}`);
                } else {
                  setIsStarted(false);
                }
              }}
              className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <ArrowRight className="rotate-180" size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Badge className="bg-indigo-600 rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest border-none">
                  {current?.level}
                </Badge> {current?.difficulty && <Badge variant="outline" className="rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest border-zinc-200 text-zinc-500 bg-white ml-2">{current.difficulty}</Badge>}
                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest italic">
                  {current?.category}
                </span>
              </div>
              <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Question {currentIdx + 1} / {questions.length}</h2>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Score actuel</div>
              <div className="text-lg font-black text-zinc-900">{score} / {questions.length}</div>
            </div>
            <div className="h-10 w-px bg-zinc-100 mx-2" />
            <div className="w-32 h-2 bg-zinc-100 rounded-full overflow-hidden">
               <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                className="h-full bg-indigo-600"
               />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="max-w-4xl w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="bg-white p-12 lg:p-20 rounded-[4rem] shadow-2xl shadow-zinc-200/50 text-center space-y-12 border border-zinc-50 relative overflow-hidden">
                <div className="relative z-10">
                   <h3 className="text-[clamp(1.5rem,3vw+1rem,2.25rem)] font-black text-zinc-900 leading-tight tracking-tight mb-8">
                    {current?.sentence}
                  </h3>
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-lg uppercase tracking-widest">
                    <Target size={20} />
                    Corriger : "{current?.error_fragment}"
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                <div className="relative group">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={status !== "typing"}
                    placeholder="Tapez votre correction ici..."
                    className={`w-full h-24 bg-white border-4 rounded-3xl px-8 text-[clamp(1.125rem,2vw+0.75rem,1.5rem)] font-black transition-all outline-none text-center shadow-xl
                      ${status === "typing" ? "border-zinc-100 focus:border-indigo-600 group-hover:border-zinc-200" :
                        status === "correct" ? "border-emerald-500 text-emerald-600 bg-emerald-50" : "border-rose-500 text-rose-600 bg-rose-50"}`}
                    onKeyPress={(e) => e.key === "Enter" && status === "typing" && checkCorrection()}
                    autoFocus
                  />
                  <AnimatePresence>
                    {status === "correct" && (
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute -right-4 -top-4 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg z-20"
                      >
                        <CheckCircle2 size={24} />
                      </motion.div>
                    )}
                    {status === "wrong" && (
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute -right-4 -top-4 w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-lg z-20"
                      >
                        <XCircle size={24} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {status === "typing" ? (
                  <Button
                    onClick={checkCorrection}
                    disabled={!inputValue.trim()}
                    className="w-full h-20 bg-zinc-900 hover:bg-black text-white font-black rounded-3xl text-xl shadow-2xl shadow-zinc-200 transition-all active:scale-95 disabled:opacity-50"
                  >
                    VÉRIFIER MA RÉPONSE
                  </Button>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <Card className={`p-8 rounded-[2rem] border-none shadow-xl ${status === "correct" ? "bg-emerald-600 text-white" : "bg-zinc-900 text-white"}`}>
                       <div className="flex items-center gap-3 mb-3 opacity-80 text-[10px] font-black uppercase tracking-widest">
                          <Sparkles size={16} /> Explication Pédagogique
                       </div>
                       <p className="text-lg font-bold leading-relaxed italic mb-4">"{current?.explanation}"</p>
                       <div className="flex items-center gap-2 font-black text-sm uppercase tracking-widest pt-4 border-t border-white/10">
                          Réponse correcte : <span className="underline decoration-wavy">{current?.correction}</span>
                       </div>
                    </Card>
                    <Button
                      onClick={nextQuestion}
                      className="w-full h-20 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-3xl text-xl shadow-2xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      {currentIdx < questions.length - 1 ? "QUESTION SUIVANTE" : "VOIR MON RÉSULTAT"}
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

export default function GrammarCheckPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>}>
      <GrammarCheckContent />
    </Suspense>
  );
}
