"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import ExerciseCard from "@/app/TEF_IRN/parcours/[id]/components/ExerciseCard";
import { Exercise } from "@/lib/parcours";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight, Loader2, Target, Sparkles, Zap, GraduationCap, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useParcours } from "@/contexts/ParcoursContext";

interface GrammarQuestion {
  difficulty?: string;
  tags?: string[];
  is_ai_generated?: boolean;
  id: string;
  sentence: string;
  error_fragment: string;
  correction: string;
  explanation: string;
  category: string;
  level: string;
}

export function GrammarCheckContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const { activeParcours, nextLesson } = useParcours();

  const [isStarted, setIsStarted] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState("A2");
  const [selectedCategory, setSelectedCategory] = useState("Grammaire");

  const [questions, setQuestions] = useState<GrammarQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [status, setStatus] = useState<"typing" | "correct" | "wrong">("typing");
  const [loading, setLoading] = useState(false);
  const [catalogue, setCatalogue] = useState<Exercise[]>([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const fetchCatalogue = useCallback(async () => {
    setLoadingCatalogue(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from("exercises")
        .select("*")
        .eq("type", "trous")
        .eq("level", selectedLevel);

      if (selectedCategory !== "Toutes") {
        query = query.ilike("category", `%${selectedCategory}%`);
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
  }, [selectedLevel, selectedCategory, supabase]);

  useEffect(() => {
    if (!isStarted) {
      fetchCatalogue();
    }
  }, [fetchCatalogue, isStarted]);

  const startSpecificExercise = useCallback(async (id: string) => {
    setLoading(true);
    const { data: d } = await supabase
      .from("exercises")
      .select("*")
      .eq("id", id)
      .single();

    if (d) {
      const formatted = [{
        id: d.id, difficulty: d.difficulty, tags: d.tags, is_ai_generated: d.is_ai_generated,
        sentence: d.content.sentence || d.instructions,
        error_fragment: d.content.error_fragment || "...",
        correction: d.content.correct_answer || d.content.correct_answers?.[0],
        explanation: d.content.explanation || "Règle de grammaire standard.",
        category: d.category,
        level: d.level
      }];
      setQuestions(formatted);
      setIsStarted(true);
    }
    setLoading(false);
  }, [supabase]);

  const startExercise = useCallback(async (lvl?: string, cat?: string) => {
    setLoading(true);
    const targetLevel = lvl || selectedLevel;
    const targetCategory = cat || selectedCategory;
    const normalizedCategory = targetCategory ? (targetCategory.charAt(0).toUpperCase() + targetCategory.slice(1).toLowerCase()) : targetCategory;
    try {
      let query = supabase
        .from("exercises")
        .select("*")
        .eq("type", "trous")
        .eq("level", targetLevel);

      if (targetCategory && targetCategory !== "Toutes") {
        const { data: catMatch } = await supabase
          .from("exercises")
          .select("*")
          .eq("type", "trous")
          .eq("level", targetLevel)
          .eq("category", normalizedCategory)
          .limit(5);

        if (catMatch && catMatch.length > 0) {
          const formatted = catMatch.map((d: any) => ({
            id: d.id, difficulty: d.difficulty, tags: d.tags, is_ai_generated: d.is_ai_generated,
            sentence: d.content.sentence || d.instructions,
            error_fragment: d.content.error_fragment || "...",
            correction: d.content.correct_answer || d.content.correct_answers?.[0],
            explanation: d.content.explanation || "Règle de grammaire standard.",
            category: d.category || targetCategory,
            level: d.level || targetLevel
          }));
          setQuestions(formatted);
          setIsStarted(true);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query.limit(5);
      if (error) throw error;

      if (data && data.length > 0) {
        const formatted = data.map((d: any) => ({
          id: d.id, difficulty: d.difficulty, tags: d.tags, is_ai_generated: d.is_ai_generated,
          sentence: d.content.sentence || d.instructions,
          error_fragment: d.content.error_fragment || "...",
          correction: d.content.correct_answer || d.content.correct_answers?.[0],
          explanation: d.content.explanation || "Règle de grammaire standard.",
          category: d.category || targetCategory,
          level: d.level || targetLevel
        }));
        setQuestions(formatted);
        setIsStarted(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedLevel, selectedCategory, supabase]);

  useEffect(() => {
    const exerciseId = (params?.id as string | undefined) || searchParams.get('id');
    const lessonId = searchParams.get('lessonId');
    const topic = searchParams.get('topic');
    const level = searchParams.get('level');

    if (exerciseId) {
      startSpecificExercise(exerciseId);
    } else if (lessonId && topic) {
      if (topic) setSelectedCategory(topic);
      if (level) setSelectedLevel(level);
      startExercise(level || undefined, topic || undefined);
    }
  }, [params?.id, searchParams, startSpecificExercise, startExercise]);

  const checkCorrection = () => {
    if (status !== "typing") return;
    const current = questions[currentIdx];
    const isCorrect = inputValue.trim().toLowerCase() === current.correction.toLowerCase();

    if (isCorrect) {
      setStatus("correct");
      setScore(score + 1);
    } else {
      setStatus("wrong");
    }
  };

  const nextQuestion = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setInputValue("");
      setStatus("typing");
    } else {
      setIsSaving(true);
      await saveResults();
      setFinished(true);
      setIsSaving(false);
      router.refresh();
    }
  };

  const saveResults = async () => {
    const finalScore = Math.round((score / questions.length) * 100);
    const { data: { user } } = await supabase.auth.getUser();

    if (user && questions.length > 0) {
      try {
        const response = await fetch('/api/exercise-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exerciseId: questions[0].id,
            score: finalScore,
            answers: {
              correct: score,
              total: questions.length
            }
          })
        });
        if (!response.ok) throw new Error("Failed to save");
      } catch (err) {
        console.error("Error saving result:", err);
      }
    }
  };

  if (loading || isSaving) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
          <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
            {isSaving ? "Enregistrement..." : "Chargement..."}
          </p>
        </div>
      </div>
    );
  }

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="p-12 text-center rounded-[3rem] shadow-2xl border-none bg-white">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="text-indigo-600" size={40} />
            </div>
            <h2 className="text-3xl font-black mb-2">Entraînement Terminé !</h2>
            <p className="text-zinc-500 font-bold mb-8 italic">Excellent travail, continuez ainsi !</p>

            <div className="bg-zinc-50 rounded-3xl p-8 mb-10">
              <div className="text-6xl font-black text-indigo-600 mb-2">{percentage}%</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Taux de réussite</div>
            </div>

            <div className="space-y-4">
              {activeParcours && (
                <Button
                  className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-lg shadow-xl shadow-indigo-100"
                  onClick={() => nextLesson()}
                >
                  Continuer le parcours
                </Button>
              )}
              <Button
                variant={activeParcours ? "ghost" : "default"}
                className={`w-full ${activeParcours ? 'h-12 text-zinc-400 hover:text-indigo-600' : 'h-16 bg-zinc-900 text-white'} font-black rounded-2xl text-lg transition-all`}
                onClick={() => {
                  if (activeParcours) {
                    router.push(`/parcours/${activeParcours.id}`);
                  } else {
                    setIsStarted(false);
                    setFinished(false);
                    setScore(0);
                    setCurrentIdx(0);
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

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-zinc-50/50 p-6 pt-16 lg:p-16">
        <div className="max-w-4xl mx-auto">
          <Badge className="bg-indigo-600 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-4 shadow-lg shadow-indigo-100 border-none">
            Module de Correction
          </Badge>
          <h1 className="text-[clamp(1.875rem,4vw+1rem,3rem)] font-black text-slate-900 tracking-tighter mb-6 uppercase">
            CHASSE AUX <span className="text-indigo-600">ERREURS</span>
          </h1>
          <p className="max-w-2xl text-xl font-medium text-slate-500 leading-relaxed mb-12 italic">
            Améliorez votre précision en identifiant et corrigeant les fautes de grammaire, d'orthographe et de conjugaison.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card className="p-8 rounded-[2.5rem] border-none bg-white shadow-xl shadow-zinc-200/50 space-y-6">
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <Target size={16} /> Niveau visé
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["A1", "A2", "B1", "B2"].map((l) => (
                    <button
                      key={l}
                      onClick={() => setSelectedLevel(l)}
                      className={`h-12 rounded-xl font-black text-sm transition-all ${selectedLevel === l ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'}`}
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
                <div className="grid grid-cols-2 gap-2">
                  {["Grammaire", "Conjugaison", "Syntaxe", "Orthographe", "Toutes"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedCategory(c)}
                      className={`h-12 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${selectedCategory === c ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="p-8 rounded-[2.5rem] border-none bg-indigo-600 text-white shadow-xl shadow-indigo-200/50 flex flex-col justify-center relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4 opacity-80">
                    <Zap size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Mode Classique</span>
                  </div>
                  <h3 className="text-2xl font-black mb-2 uppercase">Prêt à corriger ?</h3>
                  <p className="text-sm font-medium opacity-80 mb-6 italic">
                    5 questions aléatoires basées sur vos critères pour un entraînement rapide.
                  </p>
                  <Button
                    onClick={() => startExercise()}
                    className="w-full h-14 bg-white text-indigo-600 hover:bg-zinc-100 font-black rounded-xl shadow-lg"
                  >
                    LANCER L'EXERCICE
                  </Button>
                </div>
                <Sparkles className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 rotate-12" />
              </Card>

              <div className="flex items-center gap-4 px-4 text-zinc-400">
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                    <GraduationCap size={16} /> TEF IRN
                 </div>
                 <div className="w-1 h-1 bg-zinc-300 rounded-full" />
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                    <Calendar size={16} /> Entraînement Quotidien
                 </div>
              </div>
            </div>
          </div>

          {/* Catalogue Section */}
          <section className="mt-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <Badge className="bg-indigo-600 rounded-full px-3 py-1 text-white border-none">Niveau {selectedLevel}</Badge>
                <span className="text-zinc-400">•</span>
                <span className="capitalize text-zinc-500">{selectedCategory}</span>
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
