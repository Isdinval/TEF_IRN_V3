"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight, Loader2, Target, Sparkles, Zap, GraduationCap, LayoutGrid, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BreadcrumbParcours } from "@/components/parcours/BreadcrumbParcours";

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
  const parcoursId = searchParams.get("parcoursId");

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

  const startExercise = async (level?: string, category?: string) => {
    setLoading(true);
    const targetLevel = level || selectedLevel;
    const targetCategory = category || selectedCategory;

    const { data, error } = await supabase
      .from("exercises")
      .select("*")
      .eq("level", targetLevel)
      .eq("category", targetCategory)
      .eq("type", "qcm_centre_entrainement") // Note: Logic is similar to practice for now
      .limit(5);

    if (data) {
      const formatted = data.map((d: any) => ({
        id: d.id,
        sentence: d.instructions,
        error_fragment: d.content.questions[0],
        correction: d.content.options[0][d.content.correct_answers[0]],
        explanation: "Point de grammaire spécifique",
        category: d.category,
        level: d.level
      }));
      setQuestions(formatted);
      setIsStarted(true);
      setFinished(false);
      setScore(0);
      setCurrentIdx(0);
    }
    setLoading(false);
  };

  const handleCheck = () => {
    if (status !== "typing" || !inputValue.trim()) return;

    const correct = questions[currentIdx].correction.toLowerCase().trim();
    const user = inputValue.toLowerCase().trim();

    if (user === correct) {
      setStatus("correct");
      setScore(s => s + 1);
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
      setLoading(true);
      // Finalize
      await fetch('/api/exercise-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId: questions[0]?.id,
          score: Math.round((score / questions.length) * 100),
          answers: []
        })
      });
      setFinished(true);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-bold">Chargement de la session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-12">
      <div className="max-w-5xl mx-auto">
        <BreadcrumbParcours currentPage="Orthographe" />

        {!isStarted ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <header className="space-y-4">
              <Badge className="bg-indigo-600 rounded-full px-4 py-1 text-xs font-black uppercase tracking-widest border-none">
                Centre d'entraînement
              </Badge>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter">
                DÉTECTIVE <span className="text-indigo-600">ORTHOGRAPHE</span>
              </h1>
              <p className="text-xl text-slate-500 font-medium max-w-2xl">
                Améliorez votre précision en corrigeant des erreurs fréquentes adaptées à votre niveau.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-8 rounded-[2.5rem] border-none bg-white shadow-xl shadow-zinc-200/50">
                 <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Niveau</label>
                    <div className="grid grid-cols-4 gap-2">
                      {["A1", "A2", "B1", "B2"].map(l => (
                        <button key={l} onClick={() => setSelectedLevel(l)} className={`py-3 rounded-xl font-black ${selectedLevel === l ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-500'}`}>{l}</button>
                      ))}
                    </div>
                  </div>
                  <Button onClick={() => startExercise()} className="w-full h-16 rounded-2xl bg-zinc-900 text-white font-black text-lg">Commencer la session</Button>
                 </div>
              </Card>

              <Card className="p-8 rounded-[2.5rem] border-none bg-indigo-600 text-white shadow-xl shadow-indigo-200/50 flex flex-col justify-center gap-6">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Zap size={32} />
                </div>
                <h3 className="text-2xl font-black leading-tight">Mémorisez par la pratique active.</h3>
                <p className="text-indigo-100 font-medium italic">"Détecter l'erreur est la première étape pour ne plus jamais la commettre."</p>
              </Card>
            </div>
          </motion.div>
        ) : !finished ? (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm">
               <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Question {currentIdx + 1} / {questions.length}</span>
               <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-black">{questions[currentIdx].level}</Badge>
            </div>

            <Card className="p-12 rounded-[3rem] border-none shadow-2xl shadow-zinc-200/50 bg-white space-y-12">
               <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Target size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 leading-relaxed">
                    {questions[currentIdx].sentence}
                  </h3>
               </div>

               <div className="space-y-4">
                  <input
                    autoFocus
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder="Tapez la correction ici..."
                    className={`w-full h-20 px-8 rounded-2xl border-4 text-xl font-bold transition-all outline-none text-center ${
                      status === "typing" ? "border-zinc-100 focus:border-indigo-600" :
                      status === "correct" ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-rose-500 bg-rose-50 text-rose-900"
                    }`}
                  />

                  {status === "typing" ? (
                    <Button onClick={handleCheck} className="w-full h-16 rounded-2xl bg-indigo-600 text-white font-black text-lg">Vérifier</Button>
                  ) : (
                    <div className="space-y-6">
                      <div className={`p-6 rounded-2xl font-bold ${status === "correct" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                        {status === "correct" ? "Excellent ! C'est exact." : `Presque ! La bonne réponse était : ${questions[currentIdx].correction}`}
                      </div>
                      <Button onClick={nextQuestion} className="w-full h-16 rounded-2xl bg-zinc-900 text-white font-black text-lg">Question suivante <ArrowRight className="ml-2" /></Button>
                    </div>
                  )}
               </div>
            </Card>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center py-12 space-y-12">
             <div className="relative inline-block">
               <div className="w-48 h-48 rounded-[3.5rem] bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto rotate-12 shadow-xl shadow-emerald-50">
                 <Sparkles size={80} />
               </div>
             </div>
             <div className="space-y-4">
               <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Bien joué !</h2>
               <p className="text-2xl text-slate-500 font-medium">Session terminée avec un score de <span className="text-indigo-600 font-black">{Math.round((score / questions.length) * 100)}%</span></p>
             </div>
             <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => setIsStarted(false)} className="h-16 px-12 rounded-2xl bg-zinc-100 text-zinc-600 font-black text-lg">Refaire une session</Button>
                {parcoursId ? (
                    <Button onClick={() => router.push(`/parcours/${parcoursId}`)} className="h-16 px-12 rounded-2xl bg-indigo-600 text-white font-black text-lg shadow-xl shadow-indigo-200">Reprendre mon parcours</Button>
                ) : (
                    <Button onClick={() => router.push("/dashboard")} className="h-16 px-12 rounded-2xl bg-indigo-600 text-white font-black text-lg shadow-xl shadow-indigo-200">Tableau de bord</Button>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GrammarCheckPage() {
  return (
    <Suspense fallback={null}>
      <GrammarCheckContent />
    </Suspense>
  );
}
