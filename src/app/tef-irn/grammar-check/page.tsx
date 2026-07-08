"use client";

import { useState, useEffect, Suspense, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import ExerciseCard from "@/app/tef-irn/parcours/[slug]/components/ExerciseCard";
import { Exercise } from "@/lib/parcours";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Target, Sparkles, Zap, GraduationCap, Calendar, ArrowRight, RotateCcw, Trophy, BookOpen, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  instructions?: string;
  lesson_id?: string;
}

interface LessonSummary {
  title: string;
  content: string;
}

export function GrammarCheckContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const exerciseIdFromParams = (params?.id as string) || searchParams.get("id");

  const supabase = useMemo(() => createClient(), []);
  const { nextLesson } = useParcours();
  const { filters, setLevel, setCategory } = useExerciseFilters("A2", "Grammaire");

  const [mode, setMode] = useState<"selection" | "training" | "result">("selection");
  const [questions, setQuestions] = useState<GrammarQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [status, setStatus] = useState<"typing" | "correct" | "wrong">("typing");
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [catalogue, setCatalogue] = useState<Exercise[]>([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);
  const [lessonVisible, setLessonVisible] = useState(false);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [lessonCache, setLessonCache] = useState<Record<string, LessonSummary>>({});

  const hasInitialized = useRef(false);
  const isFetchingCatalogue = useRef(false);

  const fetchCatalogue = useCallback(async () => {
    if (isFetchingCatalogue.current) return;
    isFetchingCatalogue.current = true;
    setLoadingCatalogue(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let query = supabase.from("exercises").select("*").eq("type", "trous").eq("level", filters.level);
      if (filters.category !== "Toutes") query = query.ilike("category", `%${filters.category}%`);
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
      console.error("Error fetching catalogue:", err);
    } finally {
      setLoadingCatalogue(false);
      isFetchingCatalogue.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.level, filters.category, supabase]);

  useEffect(() => {
    if (mode === "selection" && !exerciseIdFromParams) {
      fetchCatalogue();
    }
  }, [fetchCatalogue, mode, exerciseIdFromParams]);

  const startTraining = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Exercise not found");

      let qs: GrammarQuestion[] = [];
      if (data.content?.questions && Array.isArray(data.content.questions)) {
          qs = data.content.questions.map((q: string, i: number) => ({
              id: `${data.id}-${i}`,
              sentence: q,
              error_fragment: data.content.error_fragments?.[i] || "",
              correction: String(data.content.corrections?.[i] || data.content.correct_answers?.[i] || ""),
              explanation: data.content.explanations?.[i] || "",
              category: data.category,
              level: data.level,
              difficulty: data.difficulty,
              instructions: data.instructions,
              lesson_id: data.lesson_id
          }));
      } else if (data.content?.sentence) {
          qs = [{
              id: data.id,
              sentence: data.content.sentence,
              error_fragment: data.content.error_fragment || "",
              correction: String(data.content.correction || data.content.correct_answer || ""),
              explanation: data.content.explanation || "",
              category: data.category,
              level: data.level,
              difficulty: data.difficulty,
              instructions: data.instructions,
              lesson_id: data.lesson_id
          }];
      }

      if (qs.length > 0) {
          setQuestions(qs);
          setMode("training");
          setCurrentIdx(0);
          setScore(0);
          setInputValue("");
          setStatus("typing");
          setLessonVisible(false);
      } else {
          setMode("selection");
      }
    } catch (err) {
      console.error("Error starting training:", err);
      setMode("selection");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (hasInitialized.current) return;
    if (exerciseIdFromParams && mode === "selection" && !loading) {
      hasInitialized.current = true;
      startTraining(exerciseIdFromParams);
    }
  }, [exerciseIdFromParams, startTraining, mode, loading]);

  const checkCorrection = () => {
    const current = questions[currentIdx];
    if (!current) return;
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
      setLessonVisible(false);
    } else {
      setMode("result");
      const finalScore = Math.round((score / questions.length) * 100);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && exerciseIdFromParams) {
          await supabase.from("exercise_attempts").insert({
            exercise_id: exerciseIdFromParams,
            score: finalScore,
            is_completed: true,
            user_id: user.id
          });
        }
      } catch (err) {
        console.error("Error saving attempt:", err);
      }
    }
  };

  const toggleLesson = useCallback(async (lessonId?: string) => {
    if (!lessonId) return;
    if (lessonVisible) {
      setLessonVisible(false);
      return;
    }
    if (!lessonCache[lessonId]) {
      setLoadingLesson(true);
      try {
        const { data, error } = await supabase
          .from("lessons")
          .select("title, content")
          .eq("id", lessonId)
          .single();
        if (error) throw error;
        if (data) {
          setLessonCache(prev => ({ ...prev, [lessonId]: data as LessonSummary }));
        }
      } catch (err) {
        console.error("Error fetching lesson:", err);
      } finally {
        setLoadingLesson(false);
      }
    }
    setLessonVisible(true);
  }, [lessonVisible, lessonCache, supabase]);

  const handleBack = () => {
    if (mode === "selection") {
      router.back();
    } else {
      setMode("selection");
      if (params?.id) {
          router.push("/tef-irn/grammar-check");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
          <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">Chargement de l'exercice...</p>
        </div>
      </div>
    );
  }

  if (mode === "result") {
    const finalPercent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8 max-w-md w-full">
          <div className="w-32 h-32 bg-indigo-600 rounded-[3rem] mx-auto flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
            <Trophy size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-zinc-900 uppercase tracking-tighter">Entraînement terminé !</h2>
            <p className="text-zinc-500 font-medium">Excellent travail de repérage et correction.</p>
          </div>
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-zinc-100 flex items-center justify-around">
            <div className="text-center">
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Score</div>
              <div className="text-3xl font-black text-zinc-900">{finalPercent}%</div>
            </div>
            <div className="w-px h-12 bg-zinc-100" />
            <div className="text-center">
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Réponses</div>
              <div className="text-3xl font-black text-emerald-600">{score} / {questions.length}</div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={() => setMode("selection")} className="h-16 bg-zinc-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all">RETOURNER AU CATALOGUE</Button>
            {nextLesson && (
              <Button onClick={() => nextLesson()} variant="outline" className="h-16 border-2 border-zinc-100 rounded-2xl font-black text-zinc-600 hover:bg-zinc-50 transition-all">LEÇON SUIVANTE</Button>
            )}
            <Button
                variant="ghost"
                onClick={() => {
                    if (exerciseIdFromParams) startTraining(exerciseIdFromParams);
                }}
                className="h-12 text-zinc-400 font-black uppercase tracking-widest text-[10px] hover:text-zinc-900"
              >
                <RotateCcw size={14} className="mr-2" /> Recommencer l'exercice
              </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (mode === "training") {
    const current = questions[currentIdx];
    const totalQuestions = questions.length;
    const progress = totalQuestions > 0 ? ((currentIdx + 1) / totalQuestions) * 100 : 0;

    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        <ExerciseLayout
          variant="compact"
          title="CHASSE AUX ERREURS"
          badge="Coach Exercice à Trous"
          badgeColor="indigo"
          onBack={handleBack}
          rightElement={
            <div className="hidden md:flex items-center gap-6">
              {current?.lesson_id && (
                <Button
                  onClick={() => toggleLesson(current.lesson_id)}
                  variant="outline"
                  className="h-10 rounded-xl border-2 border-indigo-100 bg-indigo-50 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100"
                >
                  {loadingLesson ? (
                    <Loader2 size={14} className="mr-2 animate-spin" />
                  ) : lessonVisible ? (
                    <ChevronUp size={14} className="mr-2" />
                  ) : (
                    <BookOpen size={14} className="mr-2" />
                  )}
                  {lessonVisible ? "Masquer la leçon" : "Voir la leçon"}
                </Button>
              )}
              <div className="text-right">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Score</div>
                <div className="text-2xl font-black text-zinc-900">{score} / {totalQuestions}</div>
              </div>
              <div className="h-12 w-px bg-zinc-100" />
              <div className="flex flex-col gap-2">
                 <div className="w-48 h-3 bg-zinc-100 rounded-full overflow-hidden border border-zinc-50 shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-indigo-600"
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
                <div className="bg-white p-10 lg:p-16 rounded-[5rem] shadow-2xl shadow-zinc-200/30 text-center relative overflow-hidden border-4 border-white ring-1 ring-zinc-100">
                   <div className="w-16 h-16 mx-auto bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 rotate-3 group">
                      <Target size={28} className="group-hover:scale-110 transition-transform" />
                   </div>

                   {current?.instructions && (
                     <div className="inline-block mt-4 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-black uppercase tracking-widest">
                       {current.instructions}
                     </div>
                   )}

                   <h3 className="text-xl md:text-2xl font-black text-zinc-900 leading-tight tracking-tight mt-4">
                    {current?.sentence}
                  </h3>
                  <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50 rounded-full -mr-40 -mt-40 blur-3xl opacity-30" />
                  <div className="absolute bottom-0 left-0 w-80 h-80 bg-zinc-50 rounded-full -ml-40 -mb-40 blur-3xl opacity-30" />
                </div>

                <AnimatePresence>
                  {lessonVisible && current?.lesson_id && lessonCache[current.lesson_id] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <Card className="p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm bg-white max-h-[50vh] overflow-y-auto">
                        <div className="flex items-center gap-2 mb-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                          <BookOpen size={14} /> Leçon associée
                        </div>
                        <h4 className="text-xl font-black text-zinc-900 leading-snug mb-4">
                          {lessonCache[current.lesson_id].title}
                        </h4>
                        <div className="prose prose-zinc prose-sm max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {lessonCache[current.lesson_id].content}
                          </ReactMarkdown>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-8">
                  <div className="relative">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && status === "typing" && checkCorrection()}
                      disabled={status !== "typing"}
                      autoFocus
                      placeholder="Tapez la correction ici..."
                      className={`w-full h-16 px-8 text-lg font-bold rounded-[2.5rem] border-4 transition-all outline-none text-center shadow-xl ${
                        status === "typing"
                        ? "border-zinc-100 focus:border-indigo-600 bg-white"
                        : status === "correct"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                        : "border-rose-500 bg-rose-50 text-rose-900"
                      }`}
                    />
                    {status !== "typing" && (
                       <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg bg-zinc-900">
                        {status === "correct" ? "Excellent !" : "Presque !"}
                       </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {status === "typing" ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Button
                          onClick={checkCorrection}
                          disabled={!inputValue.trim()}
                          className="w-full h-14 bg-zinc-900 hover:bg-black text-white font-black rounded-3xl text-base shadow-2xl shadow-zinc-200 transition-all active:scale-95 disabled:opacity-50"
                        >
                          VÉRIFIER MA RÉPONSE
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        <Card className={`p-8 rounded-[2.5rem] border-none shadow-xl ${status === "correct" ? "bg-emerald-600 text-white" : "bg-zinc-900 text-white"}`}>
                          <div className="flex items-center gap-3 mb-3 opacity-80 text-[10px] font-black uppercase tracking-widest">
                            <Sparkles size={16} /> Note pédagogique
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
                          {currentIdx < totalQuestions - 1 ? "QUESTION SUIVANTE" : "VOIR MON RÉSULTAT"}
                          <ArrowRight size={24} />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto px-6 py-12 lg:px-12">
        <ExerciseLayout
          title="CHASSE AUX ERREURS"
          badge="Coach Exercice à Trous"
          badgeColor="indigo"
          description="Perfectionnez votre conjugaison, grammaire, syntaxe et orthographe en repérant et corrigeant les erreurs. Progressez pas à pas en toute confiance."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 space-y-4 shadow-sm">
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Target size={14} className="text-indigo-600" /> Choisir votre niveau
              </div>
              <div className="flex gap-2">
                {["A1", "A2", "B1", "B2"].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLevel(lvl)}
                    className={`flex-1 h-12 rounded-2xl font-black transition-all ${filters.level === lvl ? 'bg-indigo-600 text-white shadow-lg' : 'bg-zinc-50 text-zinc-400 hover:border-zinc-200'}`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 space-y-4 lg:col-span-2 shadow-sm">
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <GraduationCap size={14} className="text-indigo-600" /> Thématiques
              </div>
              <div className="flex flex-wrap gap-2">
                {["Grammaire", "Conjugaison", "Syntaxe", "Orthographe", "Toutes"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-6 h-12 rounded-2xl font-black text-sm transition-all ${filters.category === cat ? 'bg-zinc-900 text-white shadow-lg' : 'bg-zinc-50 text-zinc-400 hover:border-zinc-200'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div
                onClick={() => {
                    const randomId = catalogue[Math.floor(Math.random() * catalogue.length)]?.id;
                    if (randomId) startTraining(randomId);
                }}
                className="bg-indigo-600 p-6 rounded-[2.5rem] text-white space-y-4 shadow-2xl shadow-indigo-100 relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform"
            >
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
                {[1, 2, 3, 4].map((i) => (
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
              <Card className="border-dashed border-2 border-zinc-200 rounded-[2rem] p-12 text-center bg-white shadow-sm">
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

export default function GrammarCheckPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-zinc-50"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>}>
      <GrammarCheckContent />
    </Suspense>
  );
}
