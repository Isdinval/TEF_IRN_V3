"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight, Loader2, Target, AlertCircle, Sparkles, BookOpen, Zap, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GrammarQuestion {
  id: string;
  sentence: string;
  error_fragment: string;
  correction: string;
  explanation: string;
  category: string;
  level: string;
}

export default function GrammarCheckPage() {
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

  const startExercise = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("exercises")
        .select("*")
        .eq("type", "trous")
        .eq("level", selectedLevel);

      if (selectedCategory && selectedCategory !== "Grammaire") {
        query = query.ilike("instructions", `%${selectedCategory.substring(0, 4)}%`);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(5);



      if (data && data.length > 0) {
        const formatted = data.map((d: any) => ({
          id: d.id,
          sentence: d.content.sentence || d.instructions,
          error_fragment: d.content.error_fragment || "...",
          correction: d.content.correct_answer || d.content.correct_answers?.[0],
          explanation: d.content.explanation || "Règle de grammaire standard.",
          category: d.instructions || d.category || "Grammaire",
          level: d.level || "A2"
        }));
        setQuestions(formatted);
        setIsStarted(true);
      } else {
        // Fallback robust
        setQuestions([
          {
            id: "fb1",
            sentence: "Elle est [aller] au cinéma.",
            error_fragment: "aller",
            correction: "allée",
            explanation: "Avec l'auxiliaire être, le participe passé s'accorde avec le sujet féminin.",
            category: "Accord Participe Passé",
            level: selectedLevel
          }
        ]);
        setIsStarted(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const current = questions[currentIdx];
    const isCorrect = inputValue.trim().toLowerCase() === current.correction.toLowerCase();

    if (isCorrect) {
      setStatus("correct");
      setScore(s => s + 1);
    } else {
      setStatus("wrong");
    }

    if (!isCorrect) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('user_errors').upsert({
            user_id: user.id,
            category: current.category,
            sub_category: current.error_fragment
          }, { onConflict: 'user_id, category, sub_category' });
        }
      } catch (e) {}
    }
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setInputValue("");
      setStatus("typing");
    } else {
      setFinished(true);
    }
  };

  if (!isStarted && !finished) {
    return (
      <div className="max-w-4xl mx-auto p-6 lg:p-12 space-y-12 pt-20">
        <header className="space-y-4 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em]">
            <Target size={14} /> Centre d'Entraînement
          </div>
          <h1 className="text-5xl font-black text-zinc-900 tracking-tighter uppercase">
            ORTHOGRAPHE & VOLTAIRE
          </h1>
          <p className="text-zinc-500 font-medium italic text-lg max-w-2xl">
            Pratiquez les règles de la langue française avec nos exercices interactifs de type Voltaire.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-zinc-200/50 p-10 bg-white space-y-8">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Choisir mon niveau</h3>
                <div className="grid grid-cols-4 gap-3">
                  {["A1", "A2", "B1", "B2"].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSelectedLevel(lvl)}
                      className={`h-16 rounded-2xl border-2 font-black transition-all ${
                        selectedLevel === lvl
                        ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                        : "border-zinc-50 bg-zinc-50 text-zinc-400 hover:border-zinc-200"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Catégorie</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {["Grammaire", "Conjugaison", "Syntaxe", "Orthographe"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`h-14 rounded-2xl border-2 text-xs font-black transition-all ${
                        selectedCategory === cat
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-50 bg-zinc-50 text-zinc-400 hover:border-zinc-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={startExercise}
                  disabled={loading}
                  className="w-full h-20 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl rounded-3xl shadow-2xl shadow-indigo-200 transition-all active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "COMMENCER L'EXERCICE"}
                </Button>
              </div>
            </Card>

            <Card className="rounded-[2rem] bg-orange-50 border-orange-100 p-8 flex gap-6 items-center">
               <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-orange-200">
                  <Zap size={28} fill="currentColor" />
               </div>
               <div className="space-y-1">
                  <h4 className="font-black text-orange-900 uppercase text-sm tracking-tight">Révision urgente</h4>
                  <p className="text-xs text-orange-700 font-medium leading-relaxed italic">
                    Notre algorithme a identifié des points faibles. Révisez-les maintenant pour ne pas oublier.
                  </p>
               </div>
            </Card>
          </div>

          <aside className="lg:col-span-4 space-y-6">
             <Card className="rounded-[2.5rem] border-none shadow-xl shadow-zinc-100 p-8 bg-white space-y-6">
                <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-zinc-400">
                   <Info size={14} className="text-indigo-600" /> Guide Rapide
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed font-medium">
                  Un exercice est composé de <span className="text-zinc-900 font-bold">5 questions</span>. Lisez attentivement et choisissez la bonne option.
                </p>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                   <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Objectif</p>
                   <p className="text-lg font-black text-emerald-900 tracking-tight">80% de réussite</p>
                </div>
             </Card>
          </aside>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-8">
        <Card className="w-full max-w-md text-center p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-100 border-none">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-green-600" size={40} />
          </div>
          <h1 className="text-2xl font-black mb-2">Entraînement terminé !</h1>
          <p className="text-muted-foreground mb-6 font-medium italic">Tu as obtenu un score de {score} sur {questions.length}.</p>
          <div className="text-6xl font-black text-indigo-600 mb-8 tracking-tighter">
            {Math.round((score / questions.length) * 100)}%
          </div>
          <Button
            className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-2xl shadow-xl shadow-zinc-200 transition-all"
            onClick={() => router.push('/dashboard')}
          >
            Retour au Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const current = questions[currentIdx];

  return (
    <div className="max-w-2xl mx-auto p-8 pt-16">
      <div className="mb-8 flex justify-between items-center px-2">
        <div className="space-y-1">
          <Badge variant="outline" className="text-indigo-600 border-indigo-100 bg-indigo-50 font-black text-[10px] uppercase tracking-widest">
            Orthographe • Projet Voltaire
          </Badge>
          <h2 className="text-2xl font-black text-zinc-900">{current.category}</h2>
          <p className="text-[11px] font-medium text-zinc-400 italic">Identifiez l'erreur entre crochets et tapez la forme correcte.</p>
        </div>
        <div className="text-xs font-black text-zinc-400 uppercase tracking-widest bg-zinc-100 px-3 py-1.5 rounded-full">
          Question {currentIdx + 1} / {questions.length}
        </div>
      </div>

      <div className="mb-12">
        <div className="p-10 bg-white border border-zinc-100 shadow-xl shadow-zinc-100/50 rounded-[2.5rem] text-3xl text-center font-bold text-zinc-900 leading-tight">
          {current.sentence.split('[').map((part, i) => {
             if (part.includes(']')) {
               const [fragment, rest] = part.split(']');
               return (
                 <span key={i}>
                   <span className={`px-3 py-1 rounded-xl border-2 transition-all ${status === 'correct' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : status === 'wrong' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
                     {status === 'typing' ? fragment : current.correction}
                   </span>
                   {rest}
                 </span>
               );
             }
             return part;
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === "typing" ? (
          <motion.div key="typing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <input
              type="text"
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && inputValue.trim() && handleVerify()}
              placeholder="Saisissez la correction..."
              className="w-full h-20 text-3xl font-black text-center border-b-4 border-indigo-600 focus:outline-none bg-transparent placeholder:text-zinc-100 text-zinc-900"
            />
            <Button
              className="w-full h-16 text-xl font-black bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl shadow-xl shadow-zinc-200 transition-all active:scale-[0.98]"
              onClick={handleVerify}
              disabled={!inputValue.trim()}
            >
              VÉRIFIER MA RÉPONSE
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-8 rounded-[2.5rem] border-2 shadow-lg ${status === 'correct' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}
          >
            <div className="flex items-start gap-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${status === 'correct' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                {status === 'correct' ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
              </div>
              <div className="space-y-6 flex-1">
                <div className="space-y-1">
                  <h3 className={`text-xl font-black uppercase tracking-tight ${status === 'correct' ? 'text-emerald-900' : 'text-rose-900'}`}>
                    {status === 'correct' ? "Excellent !" : "Presque..."}
                  </h3>
                  <p className="text-zinc-600 font-medium italic">
                    {status === 'correct'
                      ? `Effectivement, la réponse est bien "${current.correction}".`
                      : `La réponse correcte était "${current.correction}".`
                    }
                  </p>
                </div>

                <div className="p-6 bg-white/60 rounded-3xl border border-white/80 backdrop-blur-sm shadow-sm">
                  <div className="flex items-center gap-2 mb-3 font-black text-[10px] uppercase tracking-widest text-zinc-400">
                    <Target size={14} className="text-indigo-500" /> La règle pédagogique
                  </div>
                  <p className="text-zinc-700 leading-relaxed font-bold text-sm italic">
                    {current.explanation}
                  </p>
                </div>

                <Button
                  className={`w-full h-16 text-lg font-black rounded-2xl shadow-lg transition-all active:scale-[0.98] ${status === 'correct' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'}`}
                  onClick={nextQuestion}
                >
                  CONTINUER <ArrowRight className="ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
