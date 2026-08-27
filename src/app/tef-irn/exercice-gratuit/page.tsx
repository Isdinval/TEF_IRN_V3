"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { AudioPlayer } from "@/components/exam/AudioPlayer";
import { renderClozeText } from "@/lib/ce-format";
import { ORAL_CRITERIA_LABELS, OralCriterionKey } from "@/lib/oral-criteria";
import { captureEvent } from "@/lib/analytics";
import {
  CheckCircle2,
  Sparkles,
  Loader2,
  ArrowRight,
  BookOpen,
  Brain,
  Zap,
  AlertTriangle,
  Info,
  Mic,
  Square,
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type FreeTrialLevel = "A2" | "B1" | "B2";
type Step = "level" | "quiz" | "writing" | "speaking" | "finished";

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

interface FreeTrialWriting {
  id: string;
  prompt: string;
  instructions?: string;
  minWords?: number;
  maxTime?: number;
}

interface FreeTrialSpeaking {
  id: string;
  prompt: string;
  instructions?: string;
  prepTime?: number;
  speakTime?: number;
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

const EE_DRAFT_STORAGE_KEY = "tef_irn_free_trial_ee_draft";

// Exemple de correction statique (rédigé une fois, jamais généré à la volée) —
// montre le format réel de la grille TEF IRN sans jamais appeler l'API oral.
// Volontairement générique : ce n'est PAS une correction de l'enregistrement de
// l'utilisateur, juste un aperçu fidèle de ce que le vrai produit délivre.
interface StaticOralExample {
  overallScore: number;
  estimatedLevel: string;
  scores: Record<OralCriterionKey, number>;
  strengths: string[];
  improvements: string[];
  generalComment: string;
}

const EXAMPLE_ORAL_FEEDBACK: Record<FreeTrialLevel, StaticOralExample> = {
  A2: {
    overallScore: 58,
    estimatedLevel: "A2",
    scores: {
      pertinence_et_adequation_au_sujet: 65,
      coherence_et_interaction: 55,
      etendue_et_precision_du_vocabulaire: 50,
      correction_grammaticale: 55,
      aisance_et_fluidite: 60,
    },
    strengths: ["Réponses courtes mais compréhensibles", "Vocabulaire de base bien maîtrisé"],
    improvements: ["Développer un peu plus chaque réponse", "Travailler la conjugaison au présent"],
    generalComment: "Un niveau A2 solide sur les bases, avec une marge de progression sur la longueur des réponses.",
  },
  B1: {
    overallScore: 72,
    estimatedLevel: "B1",
    scores: {
      pertinence_et_adequation_au_sujet: 78,
      coherence_et_interaction: 68,
      etendue_et_precision_du_vocabulaire: 70,
      correction_grammaticale: 65,
      aisance_et_fluidite: 75,
    },
    strengths: ["Bonne justification des choix (parce que, car)", "Réaction naturelle aux relances de l'interlocuteur"],
    improvements: ["Varier les connecteurs logiques", "Quelques hésitations à réduire sur les temps du passé"],
    generalComment: "Un profil B1 cohérent : la communication passe bien, avec encore quelques imprécisions grammaticales.",
  },
  B2: {
    overallScore: 84,
    estimatedLevel: "B2",
    scores: {
      pertinence_et_adequation_au_sujet: 88,
      coherence_et_interaction: 82,
      etendue_et_precision_du_vocabulaire: 80,
      correction_grammaticale: 82,
      aisance_et_fluidite: 88,
    },
    strengths: ["Argumentation nuancée avec concession puis contre-argument", "Bonne fluidité, peu d'hésitations"],
    improvements: ["Affiner le registre dans les tournures les plus formelles"],
    generalComment: "Un très bon niveau B2 : l'échange est naturel et l'argumentation convainc l'interlocuteur.",
  },
};

export default function FreeExercisePage() {
  const [step, setStep] = useState<Step>("level");
  const [level, setLevel] = useState<FreeTrialLevel | null>(null);
  const [questions, setQuestions] = useState<FreeTrialQuestion[]>([]);
  const [writing, setWriting] = useState<FreeTrialWriting | null>(null);
  const [speaking, setSpeaking] = useState<FreeTrialSpeaking | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isShowingFeedback, setIsShowingFeedback] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // --- EE (écrit) ---
  const [eeAnswer, setEeAnswer] = useState("");

  // --- EO (oral) ---
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "recorded">("idle");
  const [eoAudioUrl, setEoAudioUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [showOralExample, setShowOralExample] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const currentQuestion = questions[currentQuestionIndex];

  // Restaure le brouillon EE tant qu'il correspond au sujet tiré pour cette session.
  useEffect(() => {
    if (!writing) return;
    try {
      const saved = localStorage.getItem(EE_DRAFT_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed.questionId === writing.id && typeof parsed.text === "string") {
        setEeAnswer(parsed.text);
      }
    } catch {
      // brouillon corrompu ou absent : on repart d'un texte vide, sans bloquer l'utilisateur
    }
  }, [writing]);

  const handleEeChange = (text: string) => {
    setEeAnswer(text);
    if (!writing) return;
    localStorage.setItem(EE_DRAFT_STORAGE_KEY, JSON.stringify({ questionId: writing.id, text }));
  };

  useEffect(() => {
    // Coupe le micro si l'utilisateur quitte l'étape EO en cours d'enregistrement.
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const startLevel = async (chosenLevel: FreeTrialLevel) => {
    setLevel(chosenLevel);
    setLoadingQuestions(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/free-trial/questions?level=${chosenLevel}`);
      if (!res.ok) throw new Error("Erreur lors du chargement des questions");
      const data = await res.json();
      setQuestions(data.questions);
      setWriting(data.writing ?? null);
      setSpeaking(data.speaking ?? null);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setIsShowingFeedback(false);
      setStep("quiz");
      captureEvent("free_trial_level_selected", { level: chosenLevel });
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
      captureEvent("free_trial_quiz_completed", { level, score, total: questions.length });
      setStep(writing ? "writing" : speaking ? "speaking" : "finished");
    }
  };

  const goToSignup = (from: string) => {
    captureEvent("free_trial_signup_click", { from, level });
    window.location.href = `/tef-irn/login?email=${encodeURIComponent(email)}&from=${from}`;
  };

  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setEoAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
        setRecordingState("recorded");
        captureEvent("free_trial_eo_recorded", { level });
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordingState("recording");
    } catch {
      setMicError("Impossible d'accéder au microphone. Vérifiez les autorisations de votre navigateur.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const retryRecording = () => {
    if (eoAudioUrl) URL.revokeObjectURL(eoAudioUrl);
    setEoAudioUrl(null);
    setShowOralExample(false);
    setRecordingState("idle");
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    goToSignup("test_gratuit");
  };

  const score = answers.reduce((acc, ans, idx) => acc + (ans === questions[idx].correctAnswer ? 1 : 0), 0);
  const scoreRatio = questions.length > 0 ? score / questions.length : 0;

  // Lecture indicative, pas une calibration psychométrique officielle (même
  // logique de prudence que EXAMPLE_ORAL_FEEDBACK / docs/oral-analysis-levels.md) :
  // sur 18 questions CE/CO, on ne peut pas prétendre à un niveau CECRL précis,
  // juste situer le candidat par rapport au niveau qu'il vient de choisir.
  const levelReadout = (() => {
    if (scoreRatio >= 0.75) return { label: "Bon niveau", detail: `Vous semblez à l'aise avec le niveau ${level} — peut-être même prêt pour la suite.` };
    if (scoreRatio >= 0.5) return { label: "Sur la bonne voie", detail: `Vous êtes globalement dans les clous du niveau ${level}, avec encore quelques points à consolider.` };
    return { label: "Des bases à renforcer", detail: `Le niveau ${level} demande encore du travail — un parcours personnalisé vous aidera à progresser vite.` };
  })();

  const questionPrompt = (q: FreeTrialQuestion) =>
    q.ceFormat === "trous" ? "Quel mot complète le texte surligné ?" : q.question;

  const eeWordCount = eeAnswer.trim() === "" ? 0 : eeAnswer.trim().split(/\s+/).length;
  const eeMinReached = writing?.minWords ? eeWordCount >= writing.minWords : true;

  const oralExample = level ? EXAMPLE_ORAL_FEEDBACK[level] : null;

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
                      {currentQuestionIndex === questions.length - 1 ? "Continuer" : "Question suivante"}
                      <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                    </Button>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          ) : step === "writing" && writing ? (
            <motion.div key="writing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full">
              <Card className="p-8 lg:p-12 rounded-[2.5rem] border-none shadow-xl shadow-indigo-100/50 bg-white">
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-none font-bold px-3 py-1 uppercase tracking-wider text-[10px] mb-6">
                  Expression écrite
                </Badge>

                <div className="p-5 bg-indigo-50/60 rounded-2xl border-l-4 border-indigo-600 mb-6">
                  <h3 className="font-black text-zinc-900 flex items-center gap-2 mb-1.5 text-sm">
                    <Info size={16} /> Sujet
                  </h3>
                  <p className="text-zinc-600 leading-relaxed font-medium text-sm">{writing.prompt}</p>
                </div>

                <div className="relative">
                  <Textarea
                    value={eeAnswer}
                    onChange={(e) => handleEeChange(e.target.value)}
                    placeholder="Rédigez votre réponse ici..."
                    className="min-h-[220px] p-5 text-base rounded-2xl border border-zinc-100 focus:border-indigo-600 focus:ring-0 transition-all shadow-inner bg-white"
                  />
                  {writing.minWords && (
                    <div className={`absolute bottom-3 right-4 px-3 py-1 rounded-full text-xs font-bold ${eeMinReached ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-400"}`}>
                      {eeWordCount} mots {eeMinReached ? "(Minimum atteint ✅)" : `(Min. ${writing.minWords} mots)`}
                    </div>
                  )}
                </div>

                <div className="mt-8 space-y-3">
                  <Button
                    onClick={() => goToSignup("test_gratuit_ee")}
                    disabled={eeAnswer.trim() === ""}
                    className="w-full h-14 text-lg font-black bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-40"
                  >
                    <Sparkles className="mr-2" size={18} /> Créer un compte pour continuer
                  </Button>
                  <button
                    onClick={() => setStep(speaking ? "speaking" : "finished")}
                    className="w-full text-center text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Continuer sans correction
                  </button>
                </div>
              </Card>
            </motion.div>
          ) : step === "speaking" && speaking ? (
            <motion.div key="speaking" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full">
              <Card className="p-8 lg:p-12 rounded-[2.5rem] border-none shadow-xl shadow-indigo-100/50 bg-white">
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-none font-bold px-3 py-1 uppercase tracking-wider text-[10px] mb-6">
                  Expression orale
                </Badge>

                <div className="p-5 bg-indigo-50/60 rounded-2xl border-l-4 border-indigo-600 mb-8">
                  <h3 className="font-black text-zinc-900 flex items-center gap-2 mb-1.5 text-sm">
                    <Info size={16} /> Mise en situation
                  </h3>
                  <p className="text-zinc-600 leading-relaxed font-medium text-sm">{speaking.prompt}</p>
                </div>

                <div className="flex flex-col items-center gap-4 py-6">
                  {recordingState === "idle" && (
                    <Button
                      onClick={startRecording}
                      className="w-20 h-20 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200"
                    >
                      <Mic size={28} />
                    </Button>
                  )}
                  {recordingState === "recording" && (
                    <>
                      <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                        Enregistrement en cours...
                      </div>
                      <Button
                        onClick={stopRecording}
                        className="w-20 h-20 rounded-full bg-rose-500 hover:bg-rose-600 shadow-xl shadow-rose-200"
                      >
                        <Square size={24} fill="currentColor" />
                      </Button>
                    </>
                  )}
                  {recordingState === "recorded" && eoAudioUrl && (
                    <div className="w-full flex flex-col items-center gap-4">
                      <audio controls src={eoAudioUrl} className="w-full" />
                      <button
                        onClick={retryRecording}
                        className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <RotateCcw size={14} /> Recommencer
                      </button>
                    </div>
                  )}
                  {micError && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-medium">
                      <AlertTriangle size={18} className="shrink-0" />
                      {micError}
                    </div>
                  )}
                  <p className="text-xs text-slate-400 font-medium text-center max-w-xs">
                    Votre enregistrement reste sur votre appareil — il n'est jamais envoyé à nos serveurs.
                  </p>
                </div>

                {recordingState === "recorded" && !showOralExample && (
                  <Button
                    onClick={() => { setShowOralExample(true); captureEvent("free_trial_eo_example_viewed", { level }); }}
                    variant="outline"
                    className="w-full h-12 font-bold rounded-xl border-2 border-indigo-100 text-indigo-700 hover:bg-indigo-50"
                  >
                    Voir un exemple de correction IA
                  </Button>
                )}

                {showOralExample && oralExample && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 text-xs font-bold">
                      Exemple illustratif — pas une correction de votre enregistrement. Créez un compte pour recevoir la vôtre.
                    </div>

                    <div className="p-6 bg-slate-950 rounded-2xl text-center">
                      <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Niveau estimé (exemple)</div>
                      <div className="text-4xl font-black text-white">{oralExample.estimatedLevel}</div>
                      <div className="text-sm text-slate-400 font-medium mt-1">Score global : <span className="font-black text-white">{oralExample.overallScore}/100</span></div>
                    </div>

                    <div className="p-6 bg-white border border-zinc-100 rounded-2xl space-y-4">
                      <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Détail par critère (grille officielle TEF IRN)</div>
                      {(Object.keys(ORAL_CRITERIA_LABELS) as OralCriterionKey[]).map((key) => (
                        <div key={key} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-bold text-zinc-700">{ORAL_CRITERIA_LABELS[key]}</span>
                            <span className="font-black text-indigo-600">{oralExample.scores[key]}/100</span>
                          </div>
                          <Progress value={oralExample.scores[key]} className="h-2" />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-2">
                          <CheckCircle2 size={14} /> Points forts
                        </div>
                        <ul className="text-sm font-medium text-zinc-600 space-y-1">
                          {oralExample.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                        </ul>
                      </div>
                      <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">
                          <TrendingUp size={14} /> À travailler
                        </div>
                        <ul className="text-sm font-medium text-zinc-600 space-y-1">
                          {oralExample.improvements.map((s, i) => <li key={i}>• {s}</li>)}
                        </ul>
                      </div>
                    </div>

                    <Button
                      onClick={() => goToSignup("test_gratuit_eo")}
                      className="w-full h-14 text-lg font-black bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
                    >
                      <Sparkles className="mr-2" size={18} /> Obtenir ma vraie correction IA
                    </Button>
                  </motion.div>
                )}

                {recordingState !== "recorded" && (
                  <button
                    onClick={() => setStep("finished")}
                    className="w-full mt-4 text-center text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Passer cette étape
                  </button>
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
                  <div className="w-24 h-24 bg-indigo-600 text-white rounded-full flex flex-col items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200 ring-8 ring-indigo-50">
                    <span className="text-3xl font-black">{score}</span>
                    <span className="text-[10px] font-bold opacity-70">/ {questions.length}</span>
                  </div>

                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-none font-bold px-3 py-1 uppercase tracking-wider text-[10px] mb-4">
                    {levelReadout.label} — indicatif
                  </Badge>

                  <h2 className="text-3xl font-black mb-3 text-zinc-900">Analyse terminée !</h2>
                  <p className="text-slate-500 text-base mb-2 max-w-sm mx-auto">
                    {levelReadout.detail}
                  </p>
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
                      type="submit"
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
