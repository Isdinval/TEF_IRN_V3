"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
  ArrowRight,
  AlertTriangle,
  Info,
  Mic,
  Square,
  RotateCcw,
  TrendingUp,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

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

const STEP_LABELS: Record<Step, string> = {
  level: "Choix du niveau",
  quiz: "Compréhension",
  writing: "Expression écrite",
  speaking: "Expression orale",
  finished: "Résultats",
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

  // Ouvre l'inscription dans un nouvel onglet : l'utilisateur garde sa page de
  // mini-test (et sa progression EE/EO) ouverte pendant qu'il crée son compte.
  const goToSignup = (from: string) => {
    captureEvent("free_trial_signup_click", { from, level });
    window.open(`/tef-irn/login?mode=signup&email=${encodeURIComponent(email)}&from=${from}`, "_blank", "noopener,noreferrer");
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
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--exam-paper)]">
      {/* Header compact, sticky — même structure que ExamHeader.tsx du vrai examen */}
      <header className="shrink-0 w-full bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/tef-irn" className="flex items-center gap-2 font-black text-white text-sm shrink-0">
            <div className="relative w-6 h-6 rounded-md overflow-hidden shrink-0">
              <Image src="/logo.png" alt="LlamaKusi" fill className="object-cover" />
            </div>
            <span className="hidden sm:inline">LlamaKusi</span>
          </Link>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-white/70 uppercase tracking-wider">Mini-Test TEF IRN</span>
            <span className="text-sm font-black text-white">{STEP_LABELS[step]}</span>
          </div>
        </div>
      </header>

      {/* Fine barre de progression — même structure que ProgressBar.tsx, uniquement pendant le quiz */}
      {step === "quiz" && questions.length > 0 && (
        <div className="shrink-0 w-full bg-white px-4 py-2 border-b border-[var(--exam-line)]">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wide whitespace-nowrap">
              Question {currentQuestionIndex + 1}/{questions.length}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                style={{ width: `${(currentQuestionIndex / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="min-h-full flex items-center justify-center">
        <div className="max-w-xl w-full">
          <AnimatePresence mode="wait">
            {step === "level" ? (
              <motion.div key="level" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                <div className="bg-white rounded-2xl border border-[var(--exam-line)] shadow-sm p-6">
                  <p className="text-sm text-zinc-500 font-medium mb-5">
                    Choisissez le niveau que vous préparez pour recevoir des questions adaptées.
                  </p>
                  <div className="space-y-2.5">
                    {LEVELS.map((lvl) => (
                      <button
                        key={lvl.value}
                        disabled={loadingQuestions}
                        onClick={() => startLevel(lvl.value)}
                        className="w-full p-4 text-left border border-zinc-200 rounded-xl transition-all hover:border-indigo-600 hover:bg-indigo-50/50 flex items-center justify-between gap-4 disabled:opacity-50"
                      >
                        <div>
                          <div className="font-black text-base text-[var(--exam-ink)]">Niveau {lvl.label}</div>
                          <div className="text-xs text-zinc-500 font-medium">{lvl.description}</div>
                        </div>
                        {loadingQuestions && level === lvl.value ? (
                          <Loader2 className="animate-spin text-indigo-600" size={18} />
                        ) : (
                          <ArrowRight className="text-indigo-600" size={18} />
                        )}
                      </button>
                    ))}
                  </div>
                  {loadError && (
                    <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-medium">
                      <AlertTriangle size={16} className="shrink-0" />
                      {loadError}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : step === "quiz" && currentQuestion ? (
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full"
              >
                <div className="bg-white rounded-2xl border border-[var(--exam-line)] shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-none font-bold px-2.5 py-0.5 uppercase tracking-wider text-[10px]">
                      {currentQuestion.section === "CO" ? "Compréhension orale" : "Compréhension écrite"}
                    </Badge>
                    {(currentQuestion.ceFormat || currentQuestion.coFormat) && (
                      <Badge variant="outline" className="text-zinc-500 font-bold px-2.5 py-0.5 text-[10px]">
                        {FORMAT_LABELS[currentQuestion.ceFormat || currentQuestion.coFormat || ""] || currentQuestion.ceFormat || currentQuestion.coFormat}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-zinc-500 font-bold px-2.5 py-0.5 text-[10px]">
                      NIVEAU {level}
                    </Badge>
                  </div>

                  {currentQuestion.section === "CO" && currentQuestion.audioUrl && (
                    <div className="mb-4">
                      <AudioPlayer
                        url={currentQuestion.audioUrl}
                        maxPlays={currentQuestion.maxPlays || 1}
                        questionId={currentQuestion.id}
                      />
                    </div>
                  )}

                  {currentQuestion.texte && (
                    <div className="text-sm text-zinc-600 mb-4 leading-relaxed bg-zinc-50 p-4 rounded-xl border border-zinc-100 whitespace-pre-line">
                      {currentQuestion.ceFormat === "trous"
                        ? renderClozeText(currentQuestion.texte, currentQuestion.highlightGap)
                        : currentQuestion.texte}
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <p className="font-bold text-[var(--exam-ink)] mb-3 text-base">
                      {questionPrompt(currentQuestion)}
                    </p>

                    {currentQuestion.subTexts && currentQuestion.subTexts.length > 0 && (
                      <div className="grid sm:grid-cols-2 gap-2.5 mb-4">
                        {currentQuestion.subTexts.map((sub) => (
                          <div key={sub.label} className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl">
                            <div className="font-black text-[10px] uppercase tracking-widest text-indigo-600 mb-1">{sub.label}</div>
                            <div className="text-xs text-zinc-600 font-medium">{sub.content}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {currentQuestion.options.map((opt) => {
                      const letter = opt.substring(0, 1);
                      const isSelected = answers[currentQuestionIndex] === letter;
                      const isCorrect = letter === currentQuestion.correctAnswer;
                      const showCorrectness = isShowingFeedback && (isSelected || isCorrect);
                      const badgeState = !isShowingFeedback
                        ? "bg-zinc-100 text-zinc-500"
                        : isCorrect
                          ? "bg-green-600 text-white"
                          : isSelected
                            ? "bg-red-500 text-white"
                            : "bg-zinc-100 text-zinc-400";

                      return (
                        <button
                          key={letter}
                          disabled={isShowingFeedback}
                          onClick={() => handleAnswer(letter)}
                          className={`w-full p-3 text-left border rounded-xl transition-all flex items-center gap-3 ${
                            !isShowingFeedback
                              ? "border-zinc-200 hover:border-indigo-500 hover:bg-indigo-50/50"
                              : isCorrect
                                ? "border-green-500 bg-green-50"
                                : isSelected
                                  ? "border-red-500 bg-red-50"
                                  : "border-zinc-100 opacity-40"
                          }`}
                        >
                          <div className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center font-black text-xs ${badgeState}`}>
                            {letter}
                          </div>
                          <span className="font-medium text-sm text-zinc-700 flex-1">{opt.substring(3)}</span>
                          {showCorrectness && isCorrect && <CheckCircle2 className="text-green-600 shrink-0" size={18} />}
                        </button>
                      );
                    })}
                  </div>

                  {isShowingFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 bg-indigo-50/60 rounded-xl border border-indigo-100"
                    >
                      {currentQuestion.explanation && (
                        <p className="text-indigo-900 font-medium text-xs leading-relaxed">
                          <span className="font-bold mr-1.5">Explication :</span>
                          {currentQuestion.explanation}
                        </p>
                      )}
                      <Button
                        onClick={nextQuestion}
                        className="w-full mt-4 h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg group text-sm"
                      >
                        {currentQuestionIndex === questions.length - 1 ? "Continuer" : "Question suivante"}
                        <ArrowRight className="ml-1.5 group-hover:translate-x-1 transition-transform" size={16} />
                      </Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : step === "writing" && writing ? (
              <motion.div key="writing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full">
                <div className="bg-white rounded-2xl border border-[var(--exam-line)] shadow-sm p-5">
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-none font-bold px-2.5 py-0.5 uppercase tracking-wider text-[10px] mb-4">
                    Expression écrite
                  </Badge>

                  <div className="p-4 bg-indigo-50/60 rounded-xl border-l-4 border-indigo-600 mb-4">
                    <h3 className="font-black text-[var(--exam-ink)] flex items-center gap-2 mb-1 text-xs">
                      <Info size={14} /> Sujet
                    </h3>
                    <p className="text-zinc-600 leading-relaxed font-medium text-sm">{writing.prompt}</p>
                  </div>

                  <div className="relative">
                    <Textarea
                      value={eeAnswer}
                      onChange={(e) => handleEeChange(e.target.value)}
                      placeholder="Rédigez votre réponse ici..."
                      className="min-h-[160px] p-4 text-sm rounded-xl border border-zinc-200 focus:border-indigo-600 focus:ring-0 transition-all bg-white"
                    />
                    {writing.minWords && (
                      <div className={`absolute bottom-2.5 right-3 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${eeMinReached ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-400"}`}>
                        {eeWordCount} mots {eeMinReached ? "✅" : `(min. ${writing.minWords})`}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 space-y-2">
                    <Button
                      onClick={() => goToSignup("test_gratuit_ee")}
                      disabled={eeAnswer.trim() === ""}
                      className="w-full h-11 text-sm font-black bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-40"
                    >
                      <Sparkles className="mr-2" size={16} /> Créer un compte pour continuer
                      <ExternalLink className="ml-2" size={13} />
                    </Button>
                    <p className="text-[11px] text-zinc-400 font-medium text-center">
                      Ouvre un nouvel onglet — votre brouillon reste ici.
                    </p>
                    <button
                      onClick={() => setStep(speaking ? "speaking" : "finished")}
                      className="w-full text-center text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors pt-1"
                    >
                      Continuer sans correction
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : step === "speaking" && speaking ? (
              <motion.div key="speaking" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full">
                <div className="bg-white rounded-2xl border border-[var(--exam-line)] shadow-sm p-5">
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-none font-bold px-2.5 py-0.5 uppercase tracking-wider text-[10px] mb-4">
                    Expression orale
                  </Badge>

                  <div className="p-4 bg-indigo-50/60 rounded-xl border-l-4 border-indigo-600 mb-5">
                    <h3 className="font-black text-[var(--exam-ink)] flex items-center gap-2 mb-1 text-xs">
                      <Info size={14} /> Mise en situation
                    </h3>
                    <p className="text-zinc-600 leading-relaxed font-medium text-sm">{speaking.prompt}</p>
                  </div>

                  <div className="flex flex-col items-center gap-3 py-4">
                    {recordingState === "idle" && (
                      <Button
                        onClick={startRecording}
                        className="w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-md"
                      >
                        <Mic size={24} />
                      </Button>
                    )}
                    {recordingState === "recording" && (
                      <>
                        <div className="flex items-center gap-2 text-rose-600 font-bold text-xs">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          Enregistrement en cours...
                        </div>
                        <Button
                          onClick={stopRecording}
                          className="w-16 h-16 rounded-full bg-rose-500 hover:bg-rose-600 shadow-md"
                        >
                          <Square size={20} fill="currentColor" />
                        </Button>
                      </>
                    )}
                    {recordingState === "recorded" && eoAudioUrl && (
                      <div className="w-full flex flex-col items-center gap-3">
                        <audio controls src={eoAudioUrl} className="w-full h-10" />
                        <button
                          onClick={retryRecording}
                          className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors"
                        >
                          <RotateCcw size={12} /> Recommencer
                        </button>
                      </div>
                    )}
                    {micError && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-medium">
                        <AlertTriangle size={16} className="shrink-0" />
                        {micError}
                      </div>
                    )}
                    <p className="text-[11px] text-zinc-400 font-medium text-center max-w-xs">
                      Votre enregistrement reste sur votre appareil — il n'est jamais envoyé à nos serveurs.
                    </p>
                  </div>

                  {recordingState === "recorded" && !showOralExample && (
                    <Button
                      onClick={() => { setShowOralExample(true); captureEvent("free_trial_eo_example_viewed", { level }); }}
                      variant="outline"
                      className="w-full h-10 text-sm font-bold rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    >
                      Voir un exemple de correction IA
                    </Button>
                  )}

                  {showOralExample && oralExample && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-3">
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-[11px] font-bold">
                        Exemple illustratif — pas une correction de votre enregistrement. Créez un compte pour recevoir la vôtre.
                      </div>

                      <div className="p-5 bg-[var(--exam-ink)] rounded-xl text-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1.5">Niveau estimé (exemple)</div>
                        <div className="text-3xl font-black text-white">{oralExample.estimatedLevel}</div>
                        <div className="text-xs text-zinc-300 font-medium mt-1">Score global : <span className="font-black text-white">{oralExample.overallScore}/100</span></div>
                      </div>

                      <div className="p-4 bg-white border border-zinc-100 rounded-xl space-y-3">
                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Détail par critère (grille officielle TEF IRN)</div>
                        {(Object.keys(ORAL_CRITERIA_LABELS) as OralCriterionKey[]).map((key) => (
                          <div key={key} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-zinc-700">{ORAL_CRITERIA_LABELS[key]}</span>
                              <span className="font-black text-indigo-600">{oralExample.scores[key]}/100</span>
                            </div>
                            <Progress value={oralExample.scores[key]} className="h-1.5" />
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-1.5">
                            <CheckCircle2 size={13} /> Points forts
                          </div>
                          <ul className="text-xs font-medium text-zinc-600 space-y-1">
                            {oralExample.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                          </ul>
                        </div>
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1.5">
                            <TrendingUp size={13} /> À travailler
                          </div>
                          <ul className="text-xs font-medium text-zinc-600 space-y-1">
                            {oralExample.improvements.map((s, i) => <li key={i}>• {s}</li>)}
                          </ul>
                        </div>
                      </div>

                      <Button
                        onClick={() => goToSignup("test_gratuit_eo")}
                        className="w-full h-11 text-sm font-black bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                      >
                        <Sparkles className="mr-2" size={16} /> Obtenir ma vraie correction IA
                        <ExternalLink className="ml-2" size={13} />
                      </Button>
                      <p className="text-[11px] text-zinc-400 font-medium text-center">
                        Ouvre un nouvel onglet.
                      </p>
                    </motion.div>
                  )}

                  {recordingState !== "recorded" && (
                    <button
                      onClick={() => setStep("finished")}
                      className="w-full mt-3 text-center text-xs font-bold text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      Passer cette étape
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="finished"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full"
              >
                <div className="bg-white rounded-2xl border border-[var(--exam-line)] shadow-sm text-center p-6">
                  <div className="w-16 h-16 bg-[var(--exam-ink)] text-white rounded-full flex flex-col items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-black">{score}</span>
                    <span className="text-[9px] font-bold opacity-70">/ {questions.length}</span>
                  </div>

                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-none font-bold px-2.5 py-0.5 uppercase tracking-wider text-[10px] mb-3">
                    {levelReadout.label} — indicatif
                  </Badge>

                  <h2 className="text-xl font-black mb-2 text-[var(--exam-ink)]">Analyse terminée</h2>
                  <p className="text-zinc-500 text-sm mb-1.5 max-w-sm mx-auto">
                    {levelReadout.detail}
                  </p>
                  <p className="text-zinc-500 text-sm mb-6 max-w-sm mx-auto">
                    Créez votre compte gratuitement pour continuer votre préparation TEF IRN.
                  </p>

                  <form onSubmit={handleEmailSubmit} className="space-y-2.5 max-w-sm mx-auto">
                    <input
                      type="email"
                      required
                      placeholder="votre@email.com"
                      className="w-full h-11 px-4 rounded-xl border border-zinc-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none font-medium text-sm transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button
                      type="submit"
                      className="w-full h-11 text-sm font-black bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                    >
                      <Sparkles className="mr-2" size={16} /> Créer mon compte
                      <ExternalLink className="ml-2" size={13} />
                    </Button>
                    <p className="text-[11px] text-zinc-400 font-medium">
                      Ouvre un nouvel onglet • Gratuit • Sans engagement
                    </p>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>
      </main>
    </div>
  );
}
