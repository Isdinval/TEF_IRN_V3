"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight, Loader2, Target, AlertCircle, Sparkles } from "lucide-react";
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
  const [questions, setQuestions] = useState<GrammarQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [status, setStatus] = useState<"typing" | "correct" | "wrong">("typing");
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const { data, error } = await supabase
          .from('exercises')
          .select('*')
          .eq('type', 'trous')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;

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
        } else {
          // If no data found, set fallback questions
          setQuestions([
            {
              id: "fb1",
              sentence: "Elle est [aller] au cinéma.",
              error_fragment: "aller",
              correction: "allée",
              explanation: "Avec l'auxiliaire être, le participe passé s'accorde avec le sujet féminin.",
              category: "Accord Participe Passé",
              level: "A2"
            },
            {
              id: "fb2",
              sentence: "Nous [est] contents.",
              error_fragment: "est",
              correction: "sommes",
              explanation: "Conjugaison du verbe être à la première personne du pluriel.",
              category: "Conjugaison Être",
              level: "A1"
            }
          ]);
        }
      } catch (err: any) {
        console.error("Fetch error:", err);
        // Fallback for demo when Supabase fails or env is missing
        setQuestions([
          {
            id: "fb1",
            sentence: "Elle est [aller] au cinéma.",
            error_fragment: "aller",
            correction: "allée",
            explanation: "Avec l'auxiliaire être, le participe passé s'accorde avec le sujet féminin.",
            category: "Accord Participe Passé",
            level: "A2"
          }
        ]);
      } finally {
        setLoading(false);
      }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
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
                    <Sparkles size={14} className="text-indigo-500" /> La règle pédagogique
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
