"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight, Loader2 } from "lucide-react";

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
  const [exerciseId, setExerciseId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadExercise() {
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .eq('type', 'qcm')
        .limit(1)
        .single();

      if (data) {
        setExerciseId(data.id);
        const content = data.content as any;
        const formattedQuestions = content.questions.map((q: string, i: number) => ({
          id: `${data.id}-${i}`,
          text: q,
          options: content.options[i],
          correct: content.correct_answers[i]
        }));
        setQuestions(formattedQuestions);
      }
      setLoading(false);
    }
    loadExercise();
  }, [supabase]);

  const currentQuestion = questions[currentStep];

  const handleCheck = () => {
    if (selected === currentQuestion.correct) {
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
      const finalScore = (score / questions.length) * 100;
      setIsFinished(true);

      // Enregistrer le score en base
      try {
        await fetch("/api/exercise-complete", {
          method: "POST",
          body: JSON.stringify({
            exerciseId: exerciseId,
            score: finalScore,
            answers: []
          }),
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        console.error("Failed to save progress", err);
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-indigo-600" /></div>;

  if (isFinished || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-8">
        <Card className="w-full max-w-md text-center p-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-green-600" size={40} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Entraînement terminé !</h1>
          <p className="text-muted-foreground mb-6">Tu as obtenu un score de {score} sur {questions.length}.</p>
          <div className="text-4xl font-bold text-indigo-600 mb-8">{Math.round((score / questions.length) * 100)}%</div>
          <Button className="w-full bg-indigo-600" onClick={() => window.location.href = '/dashboard'}>
            Retour au Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8 pt-16">
      <div className="mb-8 flex justify-between items-center">
        <div className="space-y-1">
          <Badge variant="outline" className="text-indigo-600">Grammaire • A1</Badge>
          <h2 className="text-xl font-semibold">Complétez la phrase</h2>
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          Question {currentStep + 1} sur {questions.length}
        </div>
      </div>

      <div className="mb-12">
        <div className="p-8 bg-muted/30 border rounded-xl text-2xl text-center font-medium">
          {currentQuestion.text}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-12">
        {currentQuestion.options.map((option, i) => (
          <button
            key={i}
            disabled={isChecked}
            onClick={() => setSelected(i)}
            className={`
              w-full p-4 rounded-lg border-2 text-left transition-all flex justify-between items-center
              ${selected === i ? 'border-indigo-600 bg-indigo-50/50' : 'border-transparent bg-white shadow-sm hover:border-muted-foreground/20'}
              ${isChecked && i === currentQuestion.correct ? 'border-green-500 bg-green-50' : ''}
              ${isChecked && selected === i && i !== currentQuestion.correct ? 'border-red-500 bg-red-50' : ''}
            `}
          >
            <span className="font-medium">{option}</span>
            {isChecked && i === currentQuestion.correct && <CheckCircle2 className="text-green-600" size={20} />}
            {isChecked && selected === i && i !== currentQuestion.correct && <XCircle className="text-red-600" size={20} />}
          </button>
        ))}
      </div>

      <div className="flex justify-end gap-4">
        {!isChecked ? (
          <Button
            disabled={selected === null}
            onClick={handleCheck}
            className="px-8 bg-indigo-600"
          >
            Vérifier
          </Button>
        ) : (
          <Button onClick={handleNext} className="px-8 bg-indigo-600">
            {currentStep < questions.length - 1 ? "Continuer" : "Terminer"} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
