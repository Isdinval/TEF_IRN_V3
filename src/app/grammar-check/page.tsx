"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight, Loader2, Target, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GrammarQuestion {
  id: string;
  sentence: string; // Ex: "Il [sont] allé au marché."
  error_fragment: string; // "sont"
  correction: string; // "est"
  explanation: string;
  category: string;
  level: string;
}

export default function GrammarCheckPage() {
  const [questions, setQuestions] = useState<GrammarQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [status, setStatus] = useState<"typing" | "correct" | "wrong">("typing");
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function fetchQuestions() {
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .eq('type', 'trous')
        .limit(10);

      if (data) {
        // Transformation des données mockées/DB pour le format Voltaire
        const formatted = data.map((d: any) => ({
          id: d.id,
          sentence: d.content.sentence || d.instructions,
          error_fragment: d.content.error_fragment || "...",
          correction: d.content.correct_answer || d.content.correct_answers?.[0],
          explanation: d.content.explanation || "Règle de grammaire standard.",
          category: d.category || "Grammaire",
          level: d.level || "A2"
        }));
        setQuestions(formatted);
      }
      setLoading(false);
    }
    fetchQuestions();
  }, [supabase]);

  const handleVerify = async () => {
    const current = questions[currentIdx];
    const isCorrect = inputValue.trim().toLowerCase() === current.correction.toLowerCase();

    if (isCorrect) {
      setStatus("correct");
      setScore(s => s + 1);
    } else {
      setStatus("wrong");
    }

    // Enregistrement de l'erreur si nécessaire pour les recommandations
    if (!isCorrect) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Appel API ou insert direct pour tracker l'erreur
        await supabase.from('user_errors').upsert({
          user_id: user.id,
          category: current.category,
          sub_category: current.error_fragment
        }, { onConflict: 'user_id, category, sub_category' });
      }
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

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>;
  if (questions.length === 0) return <div className="p-8 text-center">Aucun exercice disponible.</div>;

  const current = questions[currentIdx];

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-8">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Card className="max-w-md text-center p-12 rounded-3xl border-none shadow-2xl shadow-indigo-100">
            <div className="w-24 h-24 bg-indigo-600 rounded-3xl rotate-12 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-200">
               <Sparkles className="text-white" size={48} />
            </div>
            <h2 className="text-3xl font-black mb-2">Entraînement fini !</h2>
            <p className="text-muted-foreground mb-8 text-lg">Score final : {score} / {questions.length}</p>
            <Button className="w-full h-14 text-lg font-bold bg-indigo-600 rounded-2xl" onClick={() => window.location.href='/dashboard'}>
              Retour au Dashboard
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 pt-20">
      <header className="mb-12 flex justify-between items-end">
        <div className="space-y-2">
          <Badge className="bg-indigo-600">Projet Voltaire Style</Badge>
          <h1 className="text-4xl font-black tracking-tight">{current.category}</h1>
        </div>
        <div className="text-sm font-black text-slate-400">
          QUESTION {currentIdx + 1} / {questions.length}
        </div>
      </header>

      <div className="space-y-8">
        <Card className="p-12 border-2 border-slate-100 shadow-none rounded-3xl">
          <div className="text-3xl font-medium leading-relaxed text-slate-800 text-center">
            {/* On affiche la phrase avec le mot à corriger mis en évidence ou un trou */}
            {current.sentence.split('[').map((part, i) => {
               if (part.includes(']')) {
                 const [fragment, rest] = part.split(']');
                 return (
                   <span key={i}>
                     <span className={`px-2 py-1 rounded-lg border-2 ${status === 'correct' ? 'bg-green-100 border-green-200 text-green-700' : status === 'wrong' ? 'bg-red-100 border-red-200 text-red-700' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                       {status === 'typing' ? fragment : current.correction}
                     </span>
                     {rest}
                   </span>
                 );
               }
               return part;
            })}
          </div>
        </Card>

        <AnimatePresence mode="wait">
          {status === "typing" ? (
            <motion.div key="typing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <input
                type="text"
                autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                placeholder="Tapez la correction ici..."
                className="w-full h-20 text-2xl font-bold text-center border-b-4 border-indigo-600 focus:outline-none bg-transparent placeholder:text-slate-200"
              />
              <Button
                className="w-full h-16 text-xl font-bold bg-indigo-600 hover:bg-indigo-700 rounded-2xl"
                onClick={handleVerify}
                disabled={!inputValue.trim()}
              >
                Vérifier ma réponse
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-8 rounded-3xl border-2 ${status === 'correct' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}
            >
              <div className="flex items-start gap-4">
                {status === 'correct' ? (
                  <CheckCircle2 className="text-green-600 shrink-0" size={32} />
                ) : (
                  <XCircle className="text-red-600 shrink-0" size={32} />
                )}
                <div className="space-y-4">
                  <div>
                    <h3 className={`text-xl font-black ${status === 'correct' ? 'text-green-900' : 'text-red-900'}`}>
                      {status === 'correct' ? "Excellent !" : "Presque..."}
                    </h3>
                    <p className="text-lg opacity-80">
                      {status === 'correct'
                        ? `Effectivement, la réponse est bien "${current.correction}".`
                        : `La réponse correcte était "${current.correction}".`
                      }
                    </p>
                  </div>

                  <div className="p-4 bg-white/50 rounded-xl border border-white">
                    <div className="flex items-center gap-2 mb-2 font-bold text-xs uppercase tracking-widest opacity-50">
                      <AlertCircle size={14} /> La règle
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {current.explanation}
                    </p>
                  </div>

                  <Button
                    className={`w-full h-14 text-lg font-bold rounded-xl ${status === 'correct' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                    onClick={nextQuestion}
                  >
                    Continuer <ArrowRight className="ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
