"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight, Loader2, Target, Sparkles, Zap, GraduationCap, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ParcoursBreadcrumb } from "@/components/shared/ParcoursBreadcrumb";
import { useParcours } from "@/contexts/ParcoursContext";

interface GrammarQuestion {
  id: string;
  sentence: string;
  error_fragment: string;
  correction: string;
  explanation: string;
  category: string;
  level: string;
}

function GrammarCheckContent() {
  const searchParams = useSearchParams();
  const [isStarted, setIsStarted] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState("A2");
  const [selectedCategory, setSelectedCategory] = useState("Grammaire");

  const [questions, setQuestions] = useState<GrammarQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [status, setStatus] = useState<"typing" | "correct" | "wrong">("typing");
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const router = useRouter();
  const supabase = createClient();
  const { activeParcours, nextLesson } = useParcours();

  useEffect(() => {
    const lessonId = searchParams.get('lessonId');
    const topic = searchParams.get('topic');
    const level = searchParams.get('level');

    if (lessonId && topic) {
      if (topic) setSelectedCategory(topic);
      if (level) setSelectedLevel(level);
      startExercise(level || undefined, topic || undefined);
    }
  }, [searchParams]);

  const startExercise = async (lvl?: string, cat?: string) => {
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

      if (targetCategory && targetCategory && targetCategory !== "Toutes") {
        const { data: catMatch } = await supabase
          .from("exercises")
          .select("*")
          .eq("type", "trous")
          .eq("level", targetLevel)
          .eq("category", normalizedCategory)
          .limit(5);

        if (catMatch && catMatch.length > 0) {
          const formatted = catMatch.map((d: any) => ({
            id: d.id,
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
          id: d.id,
          sentence: d.content.sentence || d.instructions,
          error_fragment: d.content.error_fragment || "...",
          correction: d.content.correct_answer || d.content.correct_answers?.[0],
          explanation: d.content.explanation || "Règle de grammaire standard.",
          category: d.category || targetLevel,
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
  };

  const handleCheck = () => {
    const current = questions[currentIdx];
    const isCorrect = inputValue.trim().toLowerCase() === current.correction.toLowerCase();

    if (isCorrect) {
      setStatus("correct");
      setScore(s => s + 1);
      updateXP(10);
    } else {
      setStatus("wrong");
    }
  };

  const updateXP = async (amount: number) => {
    await supabase.rpc('add_xp', { amount });
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setInputValue("");
      setStatus("typing");
    } else {
      setFinished(true);
    }
  };

  if (!isStarted) {
    return (
      <div className="max-w-6xl mx-auto p-6 lg:p-12 pt-16">
        <ParcoursBreadcrumb className="mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <header>
              <Badge className="mb-4 rounded-full border-none bg-blue-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100">
                Orthographe & Grammaire
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter mb-6">
                ZÉRO <span className="text-blue-600">FAUTE.</span>
              </h1>
              <p className="text-xl font-medium text-slate-500 leading-relaxed max-w-xl">
                Identifiez et corrigez les erreurs dans des phrases courtes pour améliorer votre expression écrite.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Niveau</label>
                <div className="grid grid-cols-2 gap-2">
                  {["A1", "A2", "B1", "B2"].map((l) => (
                    <button
                      key={l}
                      onClick={() => setSelectedLevel(l)}
                      className={`h-14 rounded-2xl font-black text-lg transition-all ${selectedLevel === l ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-white text-zinc-400 hover:bg-zinc-50 border border-zinc-100'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Catégorie</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Grammaire", "Conjugaison", "Syntaxe", "Orthographe"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedCategory(c)}
                      className={`h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${selectedCategory === c ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-white text-zinc-400 hover:bg-zinc-50 border border-zinc-100'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={() => startExercise()}
              disabled={loading}
              className="w-full h-20 bg-zinc-900 hover:bg-black text-white font-black text-2xl rounded-3xl shadow-2xl shadow-zinc-200 transition-all active:scale-95 flex gap-4"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Commencer l'exercice"} <ArrowRight size={28} />
            </Button>
          </div>

          <div className="space-y-8">
            <Card className="border-none shadow-2xl shadow-blue-100 rounded-[3rem] p-8 bg-blue-600 text-white relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <Zap size={32} />
                  </div>
                  <h3 className="text-2xl font-black mb-2 tracking-tight">Mode Turbo</h3>
                  <p className="text-blue-100 text-sm font-medium mb-8 leading-relaxed">
                    Corrigez 5 phrases le plus vite possible pour gagner un bonus de XP.
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 p-3 rounded-xl border border-white/10">
                    <Target size={14} /> +50 XP par session
                  </div>
               </div>
               <Sparkles className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12" />
            </Card>

            <Card className="border-none shadow-xl shadow-zinc-100 rounded-[2.5rem] p-8 bg-zinc-50 border border-zinc-100">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="text-zinc-400" size={20} />
                <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Aujourd'hui</h4>
              </div>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed italic">
                Pratiquer l'orthographe 5 minutes par jour réduit les erreurs de 40% lors de l'examen réel.
              </p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8 bg-zinc-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xl"
        >
          <Card className="text-center p-12 rounded-[4rem] shadow-2xl shadow-blue-100 border-none bg-white">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-8 text-blue-600">
              <GraduationCap size={48} />
            </div>
            <h1 className="text-4xl font-black mb-4 tracking-tighter">Session Terminée !</h1>
            <p className="text-zinc-400 mb-10 font-bold text-lg">
              Score final : <span className="text-blue-600">{score}</span> / {questions.length}
            </p>

            <div className="space-y-4">
              {activeParcours && (
                <Button
                  className="w-full h-20 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-3xl text-xl shadow-2xl shadow-blue-200 transition-all"
                  onClick={() => nextLesson()}
                >
                  Continuer mon parcours
                </Button>
              )}
              <Button
                variant={activeParcours ? "ghost" : "default"}
                className={`w-full ${activeParcours ? 'h-12 text-zinc-400 hover:text-blue-600' : 'h-20 bg-zinc-900 hover:bg-zinc-800 text-white'} font-black rounded-3xl text-lg transition-all`}
                onClick={() => {
                  setIsStarted(false);
                  setFinished(false);
                  setCurrentIdx(0);
                  setScore(0);
                  setQuestions([]);
                }}
              >
                {activeParcours ? "Retour à la sélection libre" : "Refaire une session"}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  const current = questions[currentIdx];

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-12 pt-16">
      <header className="mb-12 flex justify-between items-center">
        <div>
           <Badge className="bg-blue-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 border-none mb-2">
            {current.level} • {current.category}
          </Badge>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">CORRECTION DE TEXTE</h2>
        </div>
        <div className="text-right">
          <div className="text-xs font-black text-zinc-400 uppercase tracking-widest">Progression</div>
          <div className="text-xl font-black text-blue-600">{currentIdx + 1} / {questions.length}</div>
        </div>
      </header>

      <div className="space-y-12">
        <Card className="p-12 rounded-[3.5rem] bg-white border border-zinc-100 shadow-2xl shadow-zinc-100 text-center space-y-8">
           <p className="text-3xl font-black text-slate-800 leading-tight">
             "{current.sentence}"
           </p>
           <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Corrigez le fragment suivant :</span>
              <span className="px-6 py-2 bg-rose-50 text-rose-600 rounded-full font-black text-xl border border-rose-100 line-through decoration-2">
                {current.error_fragment}
              </span>
           </div>
        </Card>

        <div className="space-y-6">
          <div className="relative">
             <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={status !== "typing"}
              placeholder="Écrivez votre correction ici..."
              className={`w-full h-24 text-center text-3xl font-black rounded-3xl border-4 transition-all outline-none ${
                status === "typing" ? "border-zinc-100 focus:border-blue-600 bg-white" :
                status === "correct" ? "border-emerald-500 bg-emerald-50 text-emerald-900" :
                "border-rose-500 bg-rose-50 text-rose-900"
              }`}
              onKeyDown={(e) => e.key === "Enter" && status === "typing" && handleCheck()}
            />
            {status === "correct" && <CheckCircle2 className="absolute right-8 top-1/2 -translate-y-1/2 text-emerald-500" size={40} />}
            {status === "wrong" && <XCircle className="absolute right-8 top-1/2 -translate-y-1/2 text-rose-500" size={40} />}
          </div>

          <AnimatePresence>
            {status !== "typing" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-8 rounded-[2.5rem] ${status === "correct" ? "bg-emerald-50 border border-emerald-100" : "bg-rose-50 border border-rose-100"}`}
              >
                <h4 className={`font-black uppercase text-xs tracking-widest mb-3 ${status === "correct" ? "text-emerald-600" : "text-rose-600"}`}>
                  {status === "correct" ? "Excellent !" : "Oups, la réponse était :"}
                </h4>
                {status === "wrong" && (
                   <div className="text-2xl font-black text-rose-900 mb-4 underline decoration-4">{current.correction}</div>
                )}
                <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                  "{current.explanation}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-4">
             {status === "typing" ? (
               <Button
                onClick={handleCheck}
                disabled={!inputValue.trim()}
                className="w-full h-20 bg-zinc-900 hover:bg-black text-white font-black text-xl rounded-3xl"
              >
                Vérifier
              </Button>
             ) : (
               <Button
                onClick={nextQuestion}
                className={`w-full h-20 text-white font-black text-xl rounded-3xl ${status === "correct" ? "bg-emerald-600" : "bg-red-500"}`}
              >
                Question suivante <ArrowRight className="ml-2" />
              </Button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GrammarCheck() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-blue-600" size={48} /></div>}>
      <GrammarCheckContent />
    </Suspense>
  );
}
