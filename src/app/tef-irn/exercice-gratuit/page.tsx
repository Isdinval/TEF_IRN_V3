"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AudioPlayer } from "@/components/exam/AudioPlayer";
import { renderClozeText } from "@/lib/ce-format";
import { CheckCircle2, Sparkles, Loader2, ArrowRight, BookOpen, Brain, Zap, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type FreeTrialLevel = "A2" | "B1" | "B2";

interface FreeTrialSubText {
  label: string;
  content: string;
}

interface FreeTrialQuestion {
  id: string;
  section: "CO" | "CE";
  type: "audio" | "text";
  question: string;
  texte?: string;
  options: string[];
  correctAnswer: string; // 'A' | 'B' | 'C' | 'D'
  audioUrl?: string;
  maxPlays?: number;
  ceFormat?: string;
  coFormat?: string;
  highlightGap?: number;
  subTexts?: FreeTrialSubText[];
  explanation?: string;
}

const LEVELS: { value: FreeTrialLevel; label: string; description: string }[] = [
  { value: "A2", label: "A2", description: "Carte de séjour pluriannuelle" },
  { value: "B1", label: "B1", description: "Carte de résident" },
  { value: "B2", label: "B2", description: "Naturalisation" },
];

const FORMAT_LABELS: Record<string, string> = {
  article_presse: "Article de presse",
  court: "Texte court",
  long_admin: "Document administratif",
  trous: "Texte à trous",
  multi_texte: "Textes multiples",
  annonce: "Annonce",
  chronique: "Chronique",
  micro_trottoir: "Micro-trottoir",
  repondeur: "Répondeur",
};

export default function FreeExercisePage() {
  const [step, setStep] = useState<"level" | "quiz" | "finished">("level");
  const [level, setLevel] = useState<FreeTrialLevel | null>(null);
  const [questions, setQuestions] = useState<FreeTrialQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isShowingFeedback, setIsShowingFeedback] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  const startLevel = async (chosenLevel: FreeTrialLevel) => {
    setLevel(chosenLevel);
    setLoadingQuestions(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/free-trial/questions?level=${chosenLevel}`);
      if (!res.ok) throw new Error("Erreur lors du chargement des questions");
      const data = await res.json();
      setQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setIsShowingFeedback(false);
      setStep("quiz");
    } catch {
      setLoadError("Impossible de charger le mini-test. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAnswer = (letter: string) => {
    setAnswers([...answers, letter]);
    setIsShowingFeedback(true);
  };

  const nextQuestion = () => {
    setIsShowingFeedback(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setStep("finished");
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulation of lead capture
    setTimeout(() => {
      setSubmitting(false);
      window.location.href = `/tef-irn/login?email=${encodeURIComponent(email)}&from=test_gratuit`;
    }, 1500);
  };

  const score = answers.reduce((acc, ans, idx) => acc + (ans === questions[idx].correctAnswer ? 1 : 0), 0);

  const questionPrompt = (q: FreeTrialQuestion) =>
    q.ceFormat === "trous" ? "Quel mot complète le texte surligné ?" : q.question;

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 flex flex-col items-center py-12 px-6">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <header className="text-center mb-10">
          <Link href="/tef-irn" className="inline-flex items-center gap-2 font-black text-2xl text-indigo-600 mb-6 group">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">M</div>
            LlamaKusi
          </Link>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900">Mini-Test TEF IRN</h1>
          {step === "quiz" && questions.length > 0 && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="w-full max-w-xs h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${(currentQuestionIndex / questions.length) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Question {currentQuestionIndex + 1}/{questions.length}
              </span>
            </div>
          )}
        </header>

        <AnimatePresence mode="wait">
          {step === "level" ? (
            <motion.div key="level" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
              <Card className="p-8 lg:p-12 rounded-[2.5rem] border-none shadow-xl shadow-indigo-100/50 bg-white">
                <p className="text-center text-zinc-500 font-medium mb-8">
                  Choisissez le niveau que vous préparez pour recevoir des questions adaptées.
                </p>
                <div className="space-y-3">
                  {LEVELS.map((lvl) => (
                    <button
                      key={lvl.value}
                      disabled={loadingQuestions}
                      onClick={() => startLevel(lvl.value)}
                      className="w-full p-5 lg:p-6 text-left border-2 border-slate-100 rounded-2xl transition-all hover:border-indigo-600 hover:bg-indigo-50/50 flex items-center justify-between gap-4 disabled:opacity-50"
                    >
                      <div>
                        <div className="font-black text-lg text-zinc-900">Niveau {lvl.label}</div>
                        <div className="text-sm text-zinc-500 font-medium">{lvl.description}</div>
                      </div>
                      {loadingQuestions && level === lvl.value ? (
                        <Loader2 className="animate-spin text-indigo-600" size={20} />
                      ) : (
                        <ArrowRight className="text-indigo-600" size={20} />
                      )}
                    </button>
                  ))}
                </div>
                {loadError && (
                  <div className="mt-6 flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-medium">
                    <AlertTriangle size={18} className="shrink-0" />
                    {loadError}
                  </div>
                )}
              </Card>
            </motion.div>
          ) : step === "quiz" && currentQuestion ? (
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <Card className="p-8 lg:p-12 rounded-[2.5rem] border-none shadow-xl shadow-indigo-100/50 bg-white">
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-none font-bold px-3 py-1 uppercase tracking-wider text-[10px]">
                    {currentQuestion.section === "CO" ? "Compréhension orale" : "Compréhension écrite"}
                  </Badge>
                  {(currentQuestion.ceFormat || currentQuestion.coFormat) && (
                    <Badge variant="outline" className="text-slate-400 font-bold px-3 py-1 text-[10px]">
                      {FORMAT_LABELS[currentQuestion.ceFormat || currentQuestion.coFormat || ""] || currentQuestion.ceFormat || currentQuestion.coFormat}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-slate-400 font-bold px-3 py-1 text-[10px]">
                    NIVEAU {level}
                  </Badge>
                </div>

                {currentQuestion.section === "CO" && currentQuestion.audioUrl && (
                  <div className="mb-6">
                    <AudioPlayer
                      url={currentQuestion.audioUrl}
                      maxPlays={currentQuestion.maxPlays || 1}
                      questionId={currentQuestion.id}
                    />
                  </div>
                )}

                {currentQuestion.ceFormat === "trous" && currentQuestion.texte && (
                  <div className="text-lg font-medium text-zinc-800 mb-10 leading-relaxed bg-slate-50/50 p-6 rounded-2xl border border-slate-100 whitespace-pre-line">
                    {renderClozeText(currentQuestion.texte, currentQuestion.highlightGap)}
                  </div>
                )}

                {currentQuestion.ceFormat !== "trous" && currentQuestion.texte && (
                  <div className="text-lg font-medium text-zinc-800 mb-10 leading-relaxed bg-slate-50/50 p-6 rounded-2xl border border-slate-100 whitespace-pre-line">
                    {currentQuestion.texte}
                  </div>
                )}

                <div className="space-y-3">
                  <p className="font-bold text-slate-900 mb-4 text-lg ml-1">
                    {questionPrompt(currentQuestion)}
                  </p>

                  {currentQuestion.subTexts && currentQuestion.subTexts.length > 0 && (
                    <div className="grid gap-3 mb-6">
                      {currentQuestion.subTexts.map((sub) => (
                        <div key={sub.label} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                          <div className="font-black text-xs uppercase tracking-widest text-indigo-600 mb-1">{sub.label}</div>
                          <div className="text-sm text-zinc-600 font-medium">{sub.content}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {currentQuestion.options.map((opt) => {
                    const letter = opt.substring(0, 1);
                    const isSelected = answers[currentQuestionIndex] === letter;
                    const isCorrect = letter === currentQuestion.correctAnswer;
                    const showCorrectness = isShowingFeedback && (isSelected || isCorrect);

                    return (
                      <button
                        key={letter}
                        disabled={isShowingFeedback}
                        onClick={() => handleAnswer(letter)}
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
                          <span>{opt.substring(3)}</span>
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
                    {currentQuestion.explanation && (
                      <p className="text-indigo-900 font-medium text-sm leading-relaxed">
                        <span className="font-bold mr-2">Explication :</span>
                        {currentQuestion.explanation}
                      </p>
                    )}
                    <Button
                      onClick={nextQuestion}
                      className="w-full mt-6 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl group shadow-lg shadow-indigo-600/20"
                    >
                      {currentQuestionIndex === questions.length - 1 ? "Voir mon score" : "Question suivante"}
                      <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                    </Button>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="finished"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full"
            >
              <Card className="p-8 lg:p-12 rounded-[2.5rem] border-none shadow-2xl shadow-indigo-100 text-center bg-white overflow-hidden relative">
                {/* Score Circle */}
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-indigo-600 text-white rounded-full flex flex-col items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-200 ring-8 ring-indigo-50">
                    <span className="text-3xl font-black">{score}</span>
                    <span className="text-[10px] font-bold opacity-70">/ {questions.length}</span>
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
                      disabled={submitting}
                    >
                      {submitting ? (
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
        {step !== "finished" && (
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
