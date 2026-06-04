"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight, Loader2, Target, AlertCircle } from "lucide-react";

interface Question {
  id: string;
  text: string;
  options: string[];
  correct: number;
}

export default function Practice() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exerciseId, setExerciseId] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const { data, error } = await supabase
          .from('exercises')
          .select('*')
          .eq('type', 'qcm')
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          const exercise = data[0];
          setExerciseId(exercise.id);
          const content = exercise.content as any;
          if (content && content.questions && content.questions.length > 0) {
            setQuestions(content.questions);
          } else {
             throw new Error("Contenu de l'exercice invalide.");
          }
        } else {
          // Fallback static questions for demo/empty state
          setQuestions([
            { id: "1", text: "___ chat dort sur le tapis.", options: ["Le", "Un", "La", "Les"], correct: 0 },
            { id: "2", text: "Nous ___ (parler) français ensemble.", options: ["parle", "parles", "parlons", "parlent"], correct: 2 },
            { id: "3", text: "Elle va ___ boulangerie.", options: ["à", "au", "à la", "aux"], correct: 2 }
          ]);
        }
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError("Impossible de charger les exercices.");
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [supabase]);

  const handleCheck = () => {
    if (selected === questions[currentStep].correct) {
      setScore(score + 1);
    }
    setIsChecked(true);
  };

  const handleNext = async () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelected(null);
      setIsChecked(false);
    } else {
      const finalScore = Math.round((score / questions.length) * 100);
      try {
        await fetch('/api/exercise-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exerciseId,
            score: finalScore,
            answers: { score, total: questions.length }
          })
        });
      } catch (err) {
        console.error("Error saving score:", err);
      }
      setIsFinished(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <AlertCircle className="text-red-500" size={48} />
        <h2 className="text-xl font-bold">Oups ! Une erreur est survenue</h2>
        <p className="text-zinc-500 max-w-sm">{error || "Aucun exercice disponible pour le moment."}</p>
        <Button onClick={() => router.push('/dashboard')} variant="outline">Retour au Dashboard</Button>
      </div>
    );
  }

  if (isFinished) {
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

  const currentQuestion = questions[currentStep];

  return (
    <div className="max-w-2xl mx-auto p-8 pt-16">
      <div className="mb-8 flex justify-between items-center px-2">
        <div className="space-y-1">
          <Badge variant="outline" className="text-indigo-600 border-indigo-100 bg-indigo-50 font-black text-[10px] uppercase tracking-widest">
            Grammaire • QCM
          </Badge>
          <h2 className="text-2xl font-black text-zinc-900">Complétez la phrase</h2>
        </div>
        <div className="text-xs font-black text-zinc-400 uppercase tracking-widest bg-zinc-100 px-3 py-1.5 rounded-full">
          Question {currentStep + 1} / {questions.length}
        </div>
      </div>

      <div className="mb-12">
        <div className="p-10 bg-white border border-zinc-100 shadow-xl shadow-zinc-100/50 rounded-[2.5rem] text-3xl text-center font-bold text-zinc-900 leading-tight">
          {currentQuestion?.text || "Chargement..."}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-12">
        {currentQuestion?.options?.map((option, i) => (
          <button
            key={i}
            disabled={isChecked}
            onClick={() => setSelected(i)}
            className={`
              w-full p-6 rounded-2xl border-2 text-left transition-all flex justify-between items-center font-bold text-lg
              ${selected === i ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-zinc-50 bg-white text-zinc-600 hover:border-zinc-200 shadow-sm'}
              ${isChecked && i === currentQuestion.correct ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-none' : ''}
              ${isChecked && selected === i && i !== currentQuestion.correct ? 'border-rose-500 bg-rose-50 text-rose-900 shadow-none' : ''}
            `}
          >
            <span>{option}</span>
            {isChecked && i === currentQuestion.correct && <CheckCircle2 className="text-emerald-500" size={24} />}
            {isChecked && selected === i && i !== currentQuestion.correct && <XCircle className="text-rose-500" size={24} />}
          </button>
        ))}
      </div>

      <div className="flex justify-end gap-4">
        {!isChecked ? (
          <Button
            disabled={selected === null}
            onClick={handleCheck}
            className="h-14 px-10 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-2xl shadow-xl shadow-zinc-200"
          >
            Vérifier la réponse
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="h-14 px-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 flex gap-2"
          >
            {currentStep < questions.length - 1 ? "Continuer" : "Terminer l'exercice"} <ArrowRight size={20} />
          </Button>
        )}
      </div>
    </div>
  );
}
