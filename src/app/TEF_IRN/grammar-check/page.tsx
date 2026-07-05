"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import ExerciseCard from "@/app/TEF_IRN/parcours/[slug]/components/ExerciseCard";
import { Exercise } from "@/lib/parcours";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight, Loader2, Target, Sparkles, Zap, GraduationCap, Calendar } from "lucide-react";
import { motion } from "framer-motion";
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

function ExerciseView({ id, onBack }: { id: string; onBack: () => void }) {
  const supabase = createClient();
  const { nextLesson } = useParcours();
  const [questions, setQuestions] = useState<GrammarQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [status, setStatus] = useState<"typing" | "correct" | "wrong">("typing");
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const loadExercise = async () => {
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
      }
      setLoading(false);
    };

    loadExercise();
  }, [id, supabase]);

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
    } else {
      setFinished(true);
      const finalScore = Math.round((score / questions.length) * 100);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("exercise_attempts").insert({
          exercise_id: id,
          score: finalScore,
          is_completed: true,
          user_id: user.id
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
          <p className="text-zinc-600">Chargement de l'exercice...</p>
        </div>
      </div>
    );
  }

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
            <Button onClick={onBack} className="h-16 bg-zinc-900 text-white rounded-2xl font-black text-lg">RETOURNER AU CATALOGUE</Button>
            {nextLesson && (
              <Button onClick={() => nextLesson()} variant="outline" className="h-16 border-2 border-zinc-100 rounded-2xl font-black text-zinc-600">LEÇON SUIVANTE</Button>
            )}
          </div>
        </motion.div>
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
      >
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div className="text-sm font-medium text-zinc-500">
                Question {currentIdx + 1} / {questions.length}
              </div>
              <div className="text-sm font-medium text-zinc-500">
                Score : {score} / {questions.length}
              </div>
            </div>
            <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
            </div>
          </div>

          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl p-10 mb-8"
          >
            <p className="text-xl leading-relaxed mb-8 text-zinc-800">
              {current?.sentence}
            </p>

            <div className="space-y-4">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkCorrection()}
                placeholder="Corrigez l'erreur ici..."
                className="w-full px-6 py-4 text-lg border border-zinc-200 rounded-2xl focus:outline-none focus:border-indigo-500"
              />

              {status === "typing" && (
                <Button
                  onClick={checkCorrection}
                  disabled={!inputValue.trim()}
                  className="w-full h-20 bg-zinc-900 hover:bg-black text-white font-black rounded-3xl text-xl shadow-2xl shadow-zinc-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  VÉRIFIER MA RÉPONSE
                </Button>
              )}

              {(status === "correct" || status === "wrong") && (
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
        </div>
      </ExerciseLayout>
    </div>
  );
}

export default function GrammarCheckPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const exId = (params?.id as string) || searchParams.get("id");

  if (exId) {
    return <ExerciseView key={exId} id={exId} onBack={() => window.history.back()} />;
  }

  // Catalogue
  const { filters, setLevel, setCategory } = useExerciseFilters("A2", "Grammaire");
  const [catalogue, setCatalogue] = useState<Exercise[]>([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);
  const supabase = createClient();

  const fetchCatalogue = useCallback(async () => {
    setLoadingCatalogue(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let query = supabase.from("exercises").select("*").eq("type", "trous").eq("level", filters.level);
      if (filters.category !== "Toutes") query = query.ilike("category", `%${filters.category}%`);
      const { data: exercises } = await query.limit(20);

      if (exercises && user) {
        const { data: attempts } = await supabase.from("exercise_attempts").select("exercise_id, is_completed, score").eq("user_id", user.id).in("exercise_id", exercises.map((e: any) => e.id));
        const mapped = exercises.map((ex: any) => {
          const exAttempts = attempts?.filter((a: any) => a.exercise_id === ex.id) || [];
          return { ...ex, is_completed: exAttempts.some((a: any) => a.is_completed), attempts_count: exAttempts.length, success_rate: exAttempts.length > 0 ? Math.max(...exAttempts.map((a: any) => a.score || 0)) : undefined };
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

  useEffect(() => { fetchCatalogue(); }, [fetchCatalogue]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-12 lg:px-12">
        <ExerciseLayout
          title="CHASSE AUX ERREURS"
          badge="Coach Exercice à Trous"
          badgeColor="indigo"
          description="Perfectionnez votre conjugaison, grammaire, syntaxe et orthographe en repérant et corrigeant les erreurs. Progressez pas à pas en toute confiance."
        >
          {/* Filtres et Catalogue - identique à avant */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* ... (même code filtres) ... */}
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
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-64 rounded-[2rem] bg-zinc-100 animate-pulse" />)}
              </div>
            ) : catalogue.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catalogue.map((ex: Exercise) => <ExerciseCard key={ex.id} exercise={ex} />)}
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

export default function GrammarCheckPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>}>
      <GrammarCheckContent />
    </Suspense>
  );
}
