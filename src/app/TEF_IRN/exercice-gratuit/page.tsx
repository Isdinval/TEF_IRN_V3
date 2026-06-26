"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles, Loader2, ArrowRight, BookOpen, Brain, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const QUESTIONS = [
  {
    id: 1,
    type: "COMPRÉHENSION ÉCRITE",
    level: "A2",
    text: "Chers voisins, je vous invite à mon anniversaire samedi prochain à 20h au 3ème étage. Merci de confirmer votre présence.",
    prompt: "Que demande l'auteur du message ?",
    options: ["De l'argent", "Une confirmation", "De la nourriture", "Un déménagement"],
    correctIndex: 1,
    explanation: "Le message demande explicitement de 'confirmer votre présence'."
  },
  {
    id: 2,
    type: "GRAMMAIRE",
    level: "B1",
    text: "Phrase : 'Si j'avais su, je ____ plus tôt.'",
    prompt: "Choisissez la forme correcte :",
    options: ["serais venu", "suis venu", "venais", "vienne"],
    correctIndex: 0,
    explanation: "C'est la structure de l'irréel du passé : 'si' + plus-que-parfait -> conditionnel passé."
  },
  {
    id: 3,
    type: "VOCABULAIRE",
    level: "B1",
    text: "Contexte : 'Cette plateforme est très abordable par rapport aux cours privés.'",
    prompt: "Que signifie 'abordable' ?",
    options: ["Facile à monter", "Peu coûteux", "Très loin", "Inaccessible"],
    correctIndex: 1,
    explanation: "'Abordable' est ici un synonyme de 'peu coûteux' ou 'accessible financièrement'."
  }
];

export default function FreeExercisePage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isShowingFeedback, setIsShowingFeedback] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const handleAnswer = (index: number) => {
    setAnswers([...answers, index]);
    setIsShowingFeedback(true);
  };

  const nextQuestion = () => {
    setIsShowingFeedback(false);
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulation of lead capture
    setTimeout(() => {
      setLoading(false);
      window.location.href = `/TEF_IRN/login?email=${encodeURIComponent(email)}&from=test_gratuit`;
    }, 1500);
  };

  const score = answers.reduce((acc, ans, idx) => acc + (ans === QUESTIONS[idx].correctIndex ? 1 : 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 flex flex-col items-center py-12 px-6">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <header className="text-center mb-10">
          <Link href="/TEF_IRN" className="inline-flex items-center gap-2 font-black text-2xl text-indigo-600 mb-6 group">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">M</div>
            LlamaKusi
          </Link>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900">Mini-Test TEF IRN</h1>
          {!isFinished && (
            <div className="mt-4 flex items-center justify-center gap-4">
              <div className="flex gap-1">
                {QUESTIONS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-8 rounded-full transition-all duration-500 ${
                      i < currentQuestionIndex ? "bg-green-500" :
                      i === currentQuestionIndex ? "bg-indigo-600" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Question {currentQuestionIndex + 1}/{QUESTIONS.length}
              </span>
            </div>
          )}
        </header>

        <AnimatePresence mode="wait">
          {!isFinished ? (
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <Card className="p-8 lg:p-12 rounded-[2.5rem] border-none shadow-xl shadow-indigo-100/50 bg-white">
                <div className="flex items-center gap-3 mb-6">
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-none font-bold px-3 py-1 uppercase tracking-wider text-[10px]">
                    {QUESTIONS[currentQuestionIndex].type}
                  </Badge>
                  <Badge variant="outline" className="text-slate-400 font-bold px-3 py-1 text-[10px]">
                    NIVEAU {QUESTIONS[currentQuestionIndex].level}
                  </Badge>
                </div>

                <div className="text-xl lg:text-2xl font-bold text-zinc-800 mb-10 leading-relaxed bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  {QUESTIONS[currentQuestionIndex].text}
                </div>

                <div className="space-y-3">
                  <p className="font-bold text-slate-400 mb-4 uppercase tracking-widest text-[10px] ml-1">
                    {QUESTIONS[currentQuestionIndex].prompt}
                  </p>

                  {QUESTIONS[currentQuestionIndex].options.map((opt, i) => {
                    const isSelected = answers[currentQuestionIndex] === i;
                    const isCorrect = i === QUESTIONS[currentQuestionIndex].correctIndex;
                    const showCorrectness = isShowingFeedback && (isSelected || isCorrect);

                    return (
                      <button
                        key={i}
                        disabled={isShowingFeedback}
                        onClick={() => handleAnswer(i)}
                        className={`w-full p-5 lg:p-6 text-left border-2 rounded-2xl font-bold text-lg transition-all relative overflow-hidden ${
                          !isShowingFeedback
                            ? "border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/50"
                            : isCorrect
                              ? "border-green-500 bg-green-50 text-green-700"
                              : isSelected
                                ? "border-red-500 bg-red-50 text-red-700"
                                : "border-slate-50 opacity-50"
                        }`}
                      >
                        <div className="flex items-center justify-between relative z-10">
                          <span>{opt}</span>
                          {showCorrectness && isCorrect && <CheckCircle2 className="text-green-600" size={24} />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {isShowingFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100"
                  >
                    <p className="text-indigo-900 font-medium text-sm leading-relaxed">
                      <span className="font-bold mr-2">Explication :</span>
                      {QUESTIONS[currentQuestionIndex].explanation}
                    </p>
                    <Button
                      onClick={nextQuestion}
                      className="w-full mt-6 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl group shadow-lg shadow-indigo-600/20"
                    >
                      {currentQuestionIndex === QUESTIONS.length - 1 ? "Voir mon score" : "Question suivante"}
                      <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                    </Button>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full"
            >
              <Card className="p-8 lg:p-12 rounded-[2.5rem] border-none shadow-2xl shadow-indigo-100 text-center bg-white overflow-hidden relative">
                {/* Score Circle */}
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-indigo-600 text-white rounded-full flex flex-col items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-200 ring-8 ring-indigo-50">
                    <span className="text-3xl font-black">{score}</span>
                    <span className="text-[10px] font-bold opacity-70">/ {QUESTIONS.length}</span>
                  </div>

                  <h2 className="text-3xl font-black mb-4 text-zinc-900">Analyse terminée !</h2>
                  <p className="text-slate-500 text-lg mb-10 max-w-sm mx-auto">
                    Entrez votre email pour recevoir votre **plan de progression personnalisé** et débloquer vos statistiques détaillées.
                  </p>

                  <form onSubmit={handleEmailSubmit} className="space-y-4 max-w-md mx-auto">
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="votre@email.com"
                        className="w-full h-14 lg:h-16 px-6 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none font-bold transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <Button
                      className="w-full h-14 lg:h-16 text-xl font-black bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <><Sparkles className="mr-2" /> Voir mes résultats</>
                      )}
                    </Button>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Gratuit • Sans engagement • On déteste le spam.
                    </p>
                  </form>
                </div>

                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Benefits Section */}
        {!isFinished && (
          <div className="mt-12 grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center p-4 bg-white/50 rounded-2xl">
              <Zap className="text-indigo-600 mb-2" size={20} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Rapide</span>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-white/50 rounded-2xl">
              <Brain className="text-indigo-600 mb-2" size={20} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Pédagogique</span>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-white/50 rounded-2xl">
              <BookOpen className="text-indigo-600 mb-2" size={20} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Réel</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
