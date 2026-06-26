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
import { ExerciseLayout } from "@/components/shared/ExerciseLayout";
import { useExerciseFilters } from "@/hooks/useExerciseFilters";

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
  const { filters, setLevel, setCategory } = useExerciseFilters("A2", "Grammaire");

  const [isStarted, setIsStarted] = useState(false);

  const [questions, setQuestions] = useState<GrammarQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [status, setStatus] = useState<"typing" | "correct" | "wrong">("typing");
  const [loading, setLoading] = useState(false);
  const [catalogue, setCatalogue] = useState<Exercise[]>([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);
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
    if (!isStarted) {
      fetchCatalogue();
    }
  }, [fetchCatalogue, isStarted]);

  const startSpecificExercise = useCallback(async (id: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();

    if (data && data.content?.questions) {
      const qs: GrammarQuestion[] = data.content.questions.map((q: string, i: number) => ({
        id: `${data.id}-${i}`,
        sentence: q,
        error_fragment: data.content.error_fragments[i],
        correction: data.content.corrections[i],
        explanation: data.content.explanations[i],
        category: data.category,
        level: data.level,
        difficulty: data.difficulty
      }));
      setQuestions(qs);
      setIsStarted(true);
      setCurrentIdx(0);
      setScore(0);
      setFinished(false);
      setStatus("typing");
      setInputValue("");
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const exId = searchParams.get("id") || (params?.id as string);
    if (exId) {
      startSpecificExercise(exId);
    }
  }, [params?.id, searchParams, startSpecificExercise]);

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

  const handleNextAction = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(c => c + 1);
      setInputValue("");
      setStatus("typing");
    } else {
      setFinished(true);
      // Log attempt
      const finalScore = Math.round((score / questions.length) * 100);
      const exId = searchParams.get("id") || (params?.id as string);
      if (exId) {
        await supabase.from("exercise_attempts").insert({
          exercise_id: exId,
          score: finalScore,
          is_completed: true,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
    </div>
  );

  if (finished) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8 max-w-md w-full">
           <div className="w-32 h-32 bg-indigo-600 rounded-[3rem] mx-auto flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
              <Zap size={48} />
           </div>
           <div className="space-y-2">
              <h2 className="text-4xl font-black text-zinc-900 uppercase tracking-tighter">Entraînement terminé !</h2>
              <p className="text-zinc-500 font-medium">Excellent travail de repérage et correction.</p>
           </div>
           <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-zinc-100 flex items-center justify-around">
              <div className="text-center">
                 <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Score</div>
                 <div className="text-3xl font-black text-zinc-900">{Math.round((score / questions.length) * 100)}%</div>
              </div>
              <div className="w-px h-12 bg-zinc-100" />
              <div className="text-center">
                 <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Réponses</div>
                 <div className="text-3xl font-black text-emerald-600">{score} / {questions.length}</div>
              </div>
           </div>
           <div className="flex flex-col gap-3">
              <Button onClick={() => setIsStarted(false)} className="h-16 bg-zinc-900 text-white rounded-2xl font-black text-lg">RETOURNER AU CATALOGUE</Button>
              {nextLesson && (
                <Button onClick={() => nextLesson()} variant="outline" className="h-16 border-2 border-zinc-100 rounded-2xl font-black text-zinc-600">LEÇON SUIVANTE</Button>
              )}
           </div>
        </motion.div>
      </div>
    );
  }

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12 lg:px-12">
          <ExerciseLayout
            title="CHASSE AUX ERREURS"
            badge="Coach Exercice à Trous"
            badgeColor="indigo"
            description="Perfectionnez votre conjugaison, grammaire, syntaxe et orthographe en repérant et corrigeant les erreurs. Progressez pas à pas en toute confiance."
          >
            {/* Quick Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-50 p-6 rounded-[2.5rem] border border-zinc-100 space-y-4">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Target size={14} className="text-indigo-600" /> Choisir votre niveau
                </div>
                <div className="flex gap-2">
                  {["A1", "A2", "B1", "B2"].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setLevel(lvl)}
                      className={`flex-1 h-12 rounded-2xl font-black transition-all ${filters.level === lvl ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-zinc-400 border border-zinc-100 hover:border-zinc-200'}`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-50 p-6 rounded-[2.5rem] border border-zinc-100 space-y-4 lg:col-span-2">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <GraduationCap size={14} className="text-indigo-600" /> Thématiques
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Grammaire", "Conjugaison", "Syntaxe", "Orthographe", "Toutes"].map((cat) => (
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

              <div className="bg-indigo-600 p-6 rounded-[2.5rem] text-white space-y-4 shadow-2xl shadow-indigo-100 relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
                   <Zap size={14} /> Flash entraînement
                </div>
                <h4 className="text-xl font-black leading-tight">Lancer une session aléatoire</h4>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                    <Calendar size={16} /> Entraînement Quotidien
                 </div>
              </div>
            </div>

            {/* Catalogue Section */}
            <section className="mt-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                  <Badge className="bg-indigo-600 rounded-full px-3 py-1 text-white border-none">Niveau {filters.level}</Badge>
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

  const current = questions[currentIdx];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <ExerciseLayout
        variant="compact"
        title="CHASSE AUX ERREURS"
        badge="Coach Exercice à Trous"
        badgeColor="indigo"
        onBack={() => {
          if (activeParcours) {
            router.push(`/TEF_IRN/parcours/${activeParcours.id}`);
          } else {
            setIsStarted(false);
          }
        }}
        rightElement={
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
        }
      />

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
                      onClick={handleNextAction}
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
