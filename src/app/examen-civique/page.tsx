"use client";

import { useState, useEffect, Suspense, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Loader2,
  Trophy,
  Brain,
  Target,
  Clock,
  ArrowRight,
  RotateCcw,
  Landmark,
  CheckCircle2,
  XCircle,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { updateCivicSRS } from "@/lib/civic-srs-engine";
import {
  getLocalDueCount,
  getLocalDueQuestionIds,
  getLocalMasteryMap,
  updateLocalCivicSRS,
  getLocalAttempts,
  addLocalAttempt,
  getLastLocalAttemptForMention,
  hasLocalCivicData,
  migrateLocalCivicDataToSupabase,
} from "@/lib/civic-local-store";
import { motion, AnimatePresence } from "framer-motion";
import { ExerciseLayout } from "@/components/shared/ExerciseLayout";
import Link from "next/link";

interface CivicQuestion {
  id: string;
  theme: string;
  mentions: string[];
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  source_ref: string | null;
  source_url: string | null;
}

const THEMES = [
  { value: "vivre_societe", label: "Vivre en société" },
  { value: "principes_valeurs", label: "Principes & valeurs" },
  { value: "systeme_politique", label: "Système politique" },
  { value: "droits_devoirs", label: "Droits & devoirs" },
  { value: "histoire_geo_culture", label: "Histoire, géo & culture" },
];

const MENTIONS = [
  { value: "naturalisation", label: "Naturalisation" },
  { value: "csp", label: "CSP", subtitle: "Carte de séjour pluriannuelle" },
  { value: "cr", label: "CR", subtitle: "Carte de résident" },
];

// Niveau de français CECRL requis par mention — utilisé pour personnaliser le pont vers le TEF IRN.
const MENTION_TO_LEVEL: Record<string, string> = {
  csp: "A2",
  cr: "B1",
  naturalisation: "B2",
};

interface CivicExamAttempt {
  id: string;
  mention: string;
  score: number;
  total_questions: number;
  passed: boolean;
  duration_seconds: number | null;
  created_at: string;
}

const EXAM_QUESTION_COUNT = 40;
const EXAM_DURATION_SECONDS = 45 * 60;
const EXAM_PASS_THRESHOLD = 32;
const EXAM_STORAGE_KEY = "civic_exam_session_v1";

interface PersistedExamSession {
  mention: string;
  questions: CivicQuestion[];
  examAnswers: Record<number, string>;
  examEndAt: number;
  examStartedAt: number;
}

type Mode = "selection" | "training" | "exam" | "exam_finished" | "catalogue";
type TrainingStep = "learn" | "quiz";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => 0.5 - Math.random());
}

// Tire `total` questions en répartissant équitablement entre les thématiques présentes dans `pool`,
// plutôt qu'un tirage aléatoire pur qui pourrait sur-représenter la thématique la plus fournie
// (les thématiques n'ont pas le même nombre de questions officielles disponibles).
function pickStratifiedByTheme(pool: CivicQuestion[], total: number): CivicQuestion[] {
  const themeValues = Array.from(new Set(pool.map((q) => q.theme)));
  if (themeValues.length === 0) return [];
  const perTheme = Math.floor(total / themeValues.length);

  const selected: CivicQuestion[] = [];
  const remainder: CivicQuestion[] = [];
  themeValues.forEach((themeVal) => {
    const themePool = shuffle(pool.filter((q) => q.theme === themeVal));
    selected.push(...themePool.slice(0, perTheme));
    remainder.push(...themePool.slice(perTheme));
  });

  const stillNeeded = total - selected.length;
  if (stillNeeded > 0) selected.push(...shuffle(remainder).slice(0, stillNeeded));

  return shuffle(selected).slice(0, total);
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatAttemptDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function passThresholdFor(totalQuestions: number) {
  return Math.round(totalQuestions * (EXAM_PASS_THRESHOLD / EXAM_QUESTION_COUNT));
}

function mentionLabel(value: string) {
  const m = MENTIONS.find((m) => m.value === value);
  if (!m) return value;
  return m.subtitle ? `${m.label} (${m.subtitle})` : m.label;
}

function CivicExamContent() {
  const supabase = useMemo(() => createClient(), []);

  const { user: currentUser } = useAuth();
  const [mention, setMention] = useState("naturalisation");
  const [theme, setTheme] = useState<string>("Toutes");
  const [mode, setMode] = useState<Mode>("selection");
  const [selectorTab, setSelectorTab] = useState<"training" | "exam">("training");
  const [loading, setLoading] = useState(false);
  const [dueCount, setDueCount] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<CivicExamAttempt[]>([]);
  const [filteredCount, setFilteredCount] = useState<number | null>(null);
  const [examPoolCount, setExamPoolCount] = useState<number | null>(null);
  const [catalogueQuestions, setCatalogueQuestions] = useState<CivicQuestion[]>([]);
  const [catalogueStatus, setCatalogueStatus] = useState<Record<string, "new" | "learning" | "mastered">>({});
  const [catalogueLoading, setCatalogueLoading] = useState(false);

  // Training (révision quotidienne SRS)
  const [questions, setQuestions] = useState<CivicQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<TrainingStep>("learn");
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  // Examen blanc
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [examAnswers, setExamAnswers] = useState<Record<number, string>>({});
  const [examTimeLeft, setExamTimeLeft] = useState(EXAM_DURATION_SECONDS);
  const [examEndAt, setExamEndAt] = useState<number | null>(null);
  const [examStartedAt, setExamStartedAt] = useState<number | null>(null);
  const [examResult, setExamResult] = useState<{
    score: number;
    passed: boolean;
    themeBreakdown: Record<string, { correct: number; total: number }>;
    saveFailed?: boolean;
  } | null>(null);
  const [resumableSession, setResumableSession] = useState<PersistedExamSession | null>(null);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mentionHelpOpen, setMentionHelpOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answersRef = useRef(examAnswers);
  const questionsRef = useRef<CivicQuestion[]>([]);

  useEffect(() => { answersRef.current = examAnswers; }, [examAnswers]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);

  // Détecte une session d'examen blanc interrompue (refresh, crash d'onglet...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(EXAM_STORAGE_KEY);
    if (!raw) return;
    try {
      const saved: PersistedExamSession = JSON.parse(raw);
      if (!saved?.questions?.length || !saved?.examEndAt) {
        window.localStorage.removeItem(EXAM_STORAGE_KEY);
        return;
      }
      if (Date.now() >= saved.examEndAt) {
        // Temps écoulé pendant l'absence : on soumet automatiquement avec les réponses sauvegardées.
        (async () => {
          try {
            const score = saved.questions.reduce(
              (acc, q, i) => acc + (saved.examAnswers[i] === q.correct_answer ? 1 : 0), 0
            );
            const passed = score >= passThresholdFor(saved.questions.length);
            const duration = Math.round((saved.examEndAt - saved.examStartedAt) / 1000);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from("civic_exam_attempts").insert({
                user_id: user.id,
                mention: saved.mention,
                score,
                total_questions: saved.questions.length,
                passed,
                duration_seconds: duration,
                question_ids: saved.questions.map((q) => q.id),
              });
              await Promise.all(saved.questions.map((q, i) =>
                updateCivicSRS(user.id, q.id, saved.examAnswers[i] === q.correct_answer)
              ));
            } else {
              addLocalAttempt({
                mention: saved.mention,
                score,
                total_questions: saved.questions.length,
                passed,
                duration_seconds: duration,
                question_ids: saved.questions.map((q) => q.id),
              });
              saved.questions.forEach((q, i) =>
                updateLocalCivicSRS(q.id, saved.examAnswers[i] === q.correct_answer)
              );
            }
            fetchAttempts();
          } catch (err) {
            console.error("Error auto-submitting expired civic exam session:", err);
          } finally {
            window.localStorage.removeItem(EXAM_STORAGE_KEY);
          }
        })();
      } else {
        setResumableSession(saved);
        setSelectorTab("exam");
      }
    } catch {
      window.localStorage.removeItem(EXAM_STORAGE_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persiste la session en cours à chaque changement (réponses, index...)
  useEffect(() => {
    if (mode !== "exam" || !examEndAt || !examStartedAt) return;
    const payload: PersistedExamSession = { mention, questions, examAnswers, examEndAt, examStartedAt };
    window.localStorage.setItem(EXAM_STORAGE_KEY, JSON.stringify(payload));
  }, [mode, mention, questions, examAnswers, examEndAt, examStartedAt]);

  // Avertit avant de quitter/rafraîchir la page pendant un examen blanc en cours
  useEffect(() => {
    if (mode !== "exam") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [mode]);

  const fetchDueCount = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setDueCount(getLocalDueCount()); return; }
    const { count } = await supabase
      .from("user_civic_reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .lte("next_review_at", new Date().toISOString());
    setDueCount(count || 0);
  }, [supabase]);

  const fetchAttempts = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAttempts(getLocalAttempts()); return; }
    const { data } = await supabase
      .from("civic_exam_attempts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setAttempts((data as CivicExamAttempt[]) || []);
  }, [supabase]);

  useEffect(() => { fetchDueCount(); fetchAttempts(); }, [fetchDueCount, fetchAttempts]);

  // Un visiteur anonyme avait de la progression locale (SRS + tentatives) et vient de se connecter
  // ou créer un compte : on la bascule vers Supabase avant qu'elle ne soit silencieusement perdue.
  useEffect(() => {
    if (!currentUser || !hasLocalCivicData()) return;
    migrateLocalCivicDataToSupabase(currentUser.id)
      .then(() => { fetchDueCount(); fetchAttempts(); })
      .catch((err) => console.error("Error migrating local civic data:", err));
  }, [currentUser, fetchDueCount, fetchAttempts]);

  // Compte les questions disponibles pour les filtres courants (affiché sur l'écran de sélection).
  useEffect(() => {
    let active = true;
    (async () => {
      let query = supabase.from("civic_questions").select("id", { count: "exact", head: true });
      query = query.contains("mentions", [mention]);
      if (theme !== "Toutes") query = query.eq("theme", theme);
      const { count } = await query;
      if (active) setFilteredCount(count ?? null);
    })();
    return () => { active = false; };
  }, [mention, theme, supabase]);

  // Compte le pool disponible pour l'examen blanc (toutes thématiques, mention seule) — sert au garde-fou "moins de 40 questions".
  useEffect(() => {
    let active = true;
    (async () => {
      let query = supabase.from("civic_questions").select("id", { count: "exact", head: true });
      query = query.contains("mentions", [mention]);
      const { count } = await query;
      if (active) setExamPoolCount(count ?? null);
    })();
    return () => { active = false; };
  }, [mention, supabase]);

  const openCatalogue = useCallback(async () => {
    setCatalogueLoading(true);
    setErrorMsg(null);
    try {
      let query = supabase.from("civic_questions").select("*").order("theme");
      query = query.contains("mentions", [mention]);
      if (theme !== "Toutes") query = query.eq("theme", theme);
      const { data, error } = await query;
      if (error) throw error;

      const questionsData = (data as CivicQuestion[]) || [];
      setCatalogueQuestions(questionsData);

      const { data: { user } } = await supabase.auth.getUser();
      const statusMap: Record<string, "new" | "learning" | "mastered"> = {};
      if (user && questionsData.length > 0) {
        const { data: reviews } = await supabase
          .from("user_civic_reviews")
          .select("question_id, consecutive_correct")
          .eq("user_id", user.id)
          .in("question_id", questionsData.map((q) => q.id));
        (reviews || []).forEach((r: any) => {
          statusMap[r.question_id] = (r.consecutive_correct || 0) >= 2 ? "mastered" : "learning";
        });
      } else if (!user && questionsData.length > 0) {
        const localMap = getLocalMasteryMap();
        questionsData.forEach((q) => { if (localMap[q.id]) statusMap[q.id] = localMap[q.id]; });
      }
      setCatalogueStatus(statusMap);
      setMode("catalogue");
    } catch (err) {
      console.error("Error loading civic catalogue:", err);
      setErrorMsg("Impossible de charger le catalogue. Réessayez.");
    } finally {
      setCatalogueLoading(false);
    }
  }, [mention, theme, supabase]);

  const startTraining = useCallback(async (review: boolean) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (review && user) {
        const { data: reviews } = await supabase
          .from("user_civic_reviews")
          .select("question_id")
          .eq("user_id", user.id)
          .lte("next_review_at", new Date().toISOString())
          .limit(20);

        if (reviews && reviews.length > 0) {
          const { data } = await supabase
            .from("civic_questions")
            .select("*")
            .in("id", reviews.map((r: any) => r.question_id));
          if (data && data.length > 0) {
            setQuestions(shuffle(data as CivicQuestion[]));
            setMode("training");
            setIndex(0); setStep("learn"); setFinished(false); setSessionCorrect(0);
            setLoading(false);
            return;
          }
        }
      }

      if (review && !user) {
        const dueIds = getLocalDueQuestionIds(20);
        if (dueIds.length > 0) {
          const { data } = await supabase.from("civic_questions").select("*").in("id", dueIds);
          if (data && data.length > 0) {
            setQuestions(shuffle(data as CivicQuestion[]));
            setMode("training");
            setIndex(0); setStep("learn"); setFinished(false); setSessionCorrect(0);
            setLoading(false);
            return;
          }
        }
      }

      let query = supabase.from("civic_questions").select("*");
      query = query.contains("mentions", [mention]);
      if (theme !== "Toutes") query = query.eq("theme", theme);
      const { data, error } = await query.limit(15);
      if (error) throw error;

      if (data && data.length > 0) {
        setQuestions(shuffle(data as CivicQuestion[]));
        setMode("training");
        setIndex(0); setStep("learn"); setFinished(false); setSessionCorrect(0);
      } else {
        setErrorMsg("Aucune question ne correspond à ces filtres. Essayez une autre mention ou thématique.");
      }
    } catch (err) {
      console.error("Error starting civic training:", err);
      setErrorMsg("Impossible de charger les questions. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  }, [mention, theme, supabase]);

  const handleReadyForQuiz = () => {
    const current = questions[index];
    setQuizOptions(shuffle(current.options));
    setSelectedOption(null);
    setChecked(false);
    setStep("quiz");
  };

  const handleSkip = async () => {
    const current = questions[index];
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // "Je connais déjà" est traité comme une bonne réponse : planifie la question à plus long terme
      // plutôt que de la laisser réapparaître indéfiniment dans le pool des nouvelles questions.
      if (user) await updateCivicSRS(user.id, current.id, true);
      else updateLocalCivicSRS(current.id, true);
    } catch (err) {
      console.error("Error recording skipped civic question:", err);
    }
    if (index < questions.length - 1) {
      setIndex(index + 1);
      setStep("learn");
      setSelectedOption(null);
      setChecked(false);
    } else {
      setFinished(true);
      fetchDueCount();
    }
  };

  const handleCheck = async () => {
    if (!selectedOption) return;
    setChecked(true);
    const current = questions[index];
    const isCorrect = selectedOption === current.correct_answer;
    if (isCorrect) setSessionCorrect((prev) => prev + 1);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await updateCivicSRS(user.id, current.id, isCorrect);
    else updateLocalCivicSRS(current.id, isCorrect);
  };

  const handleNext = () => {
    if (index < questions.length - 1) {
      setIndex(index + 1);
      setStep("learn");
      setSelectedOption(null);
      setChecked(false);
    } else {
      setFinished(true);
      fetchDueCount();
    }
  };

  const submitExam = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const qs = questionsRef.current;
    const ans = answersRef.current;
    if (qs.length === 0) return; // déjà soumis ou rien à soumettre
    const score = qs.reduce((acc, q, i) => acc + (ans[i] === q.correct_answer ? 1 : 0), 0);
    const passed = score >= passThresholdFor(qs.length);
    const duration = examStartedAt ? Math.round((Date.now() - examStartedAt) / 1000) : null;

    const themeBreakdown: Record<string, { correct: number; total: number }> = {};
    qs.forEach((q, i) => {
      const isCorrect = ans[i] === q.correct_answer;
      if (!themeBreakdown[q.theme]) themeBreakdown[q.theme] = { correct: 0, total: 0 };
      themeBreakdown[q.theme].total += 1;
      if (isCorrect) themeBreakdown[q.theme].correct += 1;
    });

    let saveFailed = false;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: insertError } = await supabase.from("civic_exam_attempts").insert({
          user_id: user.id,
          mention,
          score,
          total_questions: qs.length,
          passed,
          duration_seconds: duration,
          question_ids: qs.map((q) => q.id),
        });
        if (insertError) throw insertError;
        // L'examen blanc est aussi un signal d'apprentissage : on alimente le SRS.
        await Promise.all(qs.map((q, i) => updateCivicSRS(user.id, q.id, ans[i] === q.correct_answer)));
      } else {
        addLocalAttempt({
          mention,
          score,
          total_questions: qs.length,
          passed,
          duration_seconds: duration,
          question_ids: qs.map((q) => q.id),
        });
        qs.forEach((q, i) => updateLocalCivicSRS(q.id, ans[i] === q.correct_answer));
      }
    } catch (err) {
      console.error("Error submitting civic exam:", err);
      saveFailed = true;
    }
    window.localStorage.removeItem(EXAM_STORAGE_KEY);
    setExamResult({ score, passed, themeBreakdown, saveFailed });
    setMode("exam_finished");
    fetchAttempts();
  }, [examStartedAt, mention, supabase, fetchAttempts]);

  useEffect(() => {
    if (mode !== "exam" || !examEndAt) return;
    const tick = () => {
      const remaining = Math.max(0, Math.round((examEndAt - Date.now()) / 1000));
      setExamTimeLeft(remaining);
      if (remaining <= 0) submitExam();
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, examEndAt]);

  const startExam = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      let query = supabase.from("civic_questions").select("*");
      query = query.contains("mentions", [mention]);
      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) {
        setErrorMsg("Aucune question disponible pour cette sélection. Réessayez plus tard.");
        return;
      }

      let pool = data as CivicQuestion[];
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: lastAttempt } = await supabase
          .from("civic_exam_attempts")
          .select("question_ids")
          .eq("user_id", user.id)
          .eq("mention", mention)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const lastIds: string[] = lastAttempt?.question_ids || [];
        if (lastIds.length > 0) {
          const filtered = pool.filter((q) => !lastIds.includes(q.id));
          // On n'exclut que si assez de questions restent pour composer l'examen complet.
          if (filtered.length >= EXAM_QUESTION_COUNT) pool = filtered;
        }
      } else {
        const lastIds = getLastLocalAttemptForMention(mention)?.question_ids || [];
        if (lastIds.length > 0) {
          const filtered = pool.filter((q) => !lastIds.includes(q.id));
          if (filtered.length >= EXAM_QUESTION_COUNT) pool = filtered;
        }
      }

      const picked = pickStratifiedByTheme(pool, EXAM_QUESTION_COUNT)
        .map((q) => ({ ...q, options: shuffle(q.options) }));
      const startedAt = Date.now();
      setQuestions(picked);
      setExamAnswers({});
      setIndex(0);
      setExamEndAt(startedAt + EXAM_DURATION_SECONDS * 1000);
      setExamTimeLeft(EXAM_DURATION_SECONDS);
      setExamStartedAt(startedAt);
      setExamModalOpen(false);
      setExamResult(null);
      setMode("exam");
    } catch (err) {
      console.error("Error starting civic exam:", err);
      setErrorMsg("Impossible de démarrer l'examen. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  }, [mention, supabase]);

  const resumeExam = () => {
    if (!resumableSession) return;
    setMention(resumableSession.mention);
    setQuestions(resumableSession.questions);
    setExamAnswers(resumableSession.examAnswers);
    setIndex(0);
    setExamEndAt(resumableSession.examEndAt);
    setExamStartedAt(resumableSession.examStartedAt);
    setExamTimeLeft(Math.max(0, Math.round((resumableSession.examEndAt - Date.now()) / 1000)));
    setResumableSession(null);
    setMode("exam");
  };

  const abandonResumableExam = () => {
    window.localStorage.removeItem(EXAM_STORAGE_KEY);
    setResumableSession(null);
  };

  const handleBackToSelection = () => {
    setMode("selection");
    setQuestions([]);
    setIndex(0);
    setFinished(false);
    setSessionCorrect(0);
  };

  if (loading && mode === "selection") {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  // === RÉSULTATS EXAMEN BLANC ===
  if (mode === "exam_finished" && examResult) {
    const wrongAnswers = questions
      .map((q, i) => ({ q, given: examAnswers[i] }))
      .filter(({ q, given }) => given !== q.correct_answer);

    const handleReviewMistakes = () => {
      setQuestions(shuffle(wrongAnswers.map((w) => w.q)));
      setIndex(0);
      setStep("learn");
      setFinished(false);
      setSessionCorrect(0);
      setMode("training");
    };

    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8 max-w-xl w-full">
          <div className="text-center space-y-4">
            <div className={`w-20 h-20 rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-2xl ${examResult.passed ? 'bg-emerald-600 shadow-emerald-200' : 'bg-rose-500 shadow-rose-200'}`}>
              <Trophy size={36} />
            </div>
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">
              {examResult.passed ? "Examen réussi !" : "Pas encore, réessayez"}
            </h2>
            <p className="text-sm text-zinc-500 font-medium">
              Score : {examResult.score} / {questions.length} (seuil de réussite : {passThresholdFor(questions.length)}/{questions.length})
            </p>
          </div>

          {examResult.saveFailed && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
              ⚠️ Votre résultat n'a pas pu être enregistré (problème de connexion). Notez votre score, il n'apparaîtra pas dans votre historique.
            </div>
          )}

          <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-6 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Résultat par thématique</p>
            {Object.entries(examResult.themeBreakdown).map(([themeVal, stats]) => {
              const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
              return (
                <div key={themeVal} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-700">
                    <span>{THEMES.find((t) => t.value === themeVal)?.label || themeVal}</span>
                    <span>{stats.correct}/{stats.total}</span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {wrongAnswers.length > 0 && (
            <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-6 space-y-4 max-h-96 overflow-y-auto">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                {wrongAnswers.length} question{wrongAnswers.length > 1 ? "s" : ""} à revoir
              </p>
              {wrongAnswers.map(({ q, given }) => (
                <div key={q.id} className="p-4 rounded-2xl bg-zinc-50 space-y-1">
                  <p className="text-sm font-bold text-zinc-800">{q.question}</p>
                  {given && <p className="text-xs text-rose-600 font-medium">Votre réponse : {given}</p>}
                  <p className="text-xs text-emerald-600 font-medium">Bonne réponse : {q.correct_answer}</p>
                  {q.explanation && <p className="text-xs text-zinc-500 italic">{q.explanation}</p>}
                </div>
              ))}
            </div>
          )}

          {!currentUser && (
            <div className="p-6 rounded-[2rem] bg-indigo-50 border border-indigo-100 space-y-3 text-center">
              <p className="text-sm font-black text-indigo-900">
                Vous préparez aussi votre dossier {mentionLabel(mention)} ?
              </p>
              <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                Le niveau de français généralement requis pour cette démarche est {MENTION_TO_LEVEL[mention] || "B1"}.
                LlamaKusi vous entraîne aussi pour le TEF IRN, avec un coach IA à l'oral et à l'écrit.
              </p>
              <Link href="/tef-irn/login?from=examen_civique" className="block">
                <Button className="w-full h-11 bg-indigo-600 text-white rounded-2xl font-black text-sm">
                  Découvrir la préparation TEF IRN <ArrowRight className="ml-2" size={16} />
                </Button>
              </Link>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">
                Créez un compte gratuit pour aussi sauvegarder votre progression civique
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {wrongAnswers.length > 0 && (
              <Button onClick={handleReviewMistakes} className="w-full h-12 bg-indigo-600 text-white rounded-2xl font-black text-sm">
                Réviser mes {wrongAnswers.length} erreur{wrongAnswers.length > 1 ? "s" : ""} <ArrowRight className="ml-2" size={16} />
              </Button>
            )}
            <Button onClick={handleBackToSelection} variant={wrongAnswers.length > 0 ? "secondary" : undefined} className={`w-full h-12 rounded-2xl font-black text-sm ${wrongAnswers.length > 0 ? 'bg-zinc-100 text-zinc-600' : 'bg-zinc-900 text-white'}`}>
              Retour à l'accueil
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // === MODE EXAMEN BLANC (en cours) ===
  if (mode === "exam") {
    const current = questions[index];
    const answeredCount = Object.keys(examAnswers).length;
    const unansweredCount = questions.length - answeredCount;

    const handleAbandonExam = () => {
      if (!window.confirm("Abandonner l'examen en cours ? Votre progression ne sera pas enregistrée.")) return;
      if (timerRef.current) clearInterval(timerRef.current);
      window.localStorage.removeItem(EXAM_STORAGE_KEY);
      setMode("selection");
      setQuestions([]);
      setExamAnswers({});
      setExamEndAt(null);
      setExamStartedAt(null);
    };

    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        <header className="bg-white border-b border-zinc-100 px-6 py-3 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className="bg-indigo-600 text-white rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest">
                Examen blanc • {mentionLabel(mention)}
              </Badge>
              <button
                onClick={handleAbandonExam}
                className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-rose-600 transition-colors"
              >
                Abandonner
              </button>
            </div>
            <div className={`flex items-center gap-2 font-black text-sm ${examTimeLeft < 300 ? 'text-rose-600' : 'text-zinc-900'}`}>
              <Clock size={16} /> {formatTime(examTimeLeft)}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto p-4 lg:p-8 space-y-6">
          <div className="flex flex-wrap gap-2">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-8 h-8 rounded-lg text-[11px] font-black transition-all ${
                  i === index ? 'bg-zinc-900 text-white' : examAnswers[i] ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-zinc-200 text-zinc-400'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <Card className="p-8 rounded-[2rem] border-none shadow-sm space-y-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Question {index + 1} / {questions.length}</p>
            <h2 className="text-lg font-black text-zinc-900">{current?.question}</h2>
            <div className="grid grid-cols-1 gap-3">
              {current?.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setExamAnswers((prev) => ({ ...prev, [index]: opt }))}
                  className={`w-full p-4 rounded-2xl border-2 text-left font-bold text-sm transition-all ${
                    examAnswers[index] === opt ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-zinc-100 bg-white text-zinc-600 hover:border-zinc-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </Card>

          <div className="flex items-center justify-between gap-4">
            <Button
              variant="secondary"
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
              className="h-12 bg-zinc-100 text-zinc-600 font-black rounded-2xl text-sm"
            >
              Précédent
            </Button>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              {answeredCount} / {questions.length} répondues
            </p>
            {index < questions.length - 1 ? (
              <Button onClick={() => setIndex(index + 1)} className="h-12 bg-zinc-900 text-white font-black rounded-2xl text-sm">
                Suivant
              </Button>
            ) : (
              <Button onClick={() => setConfirmSubmitOpen(true)} className="h-12 bg-emerald-600 text-white font-black rounded-2xl text-sm">
                Terminer l'examen
              </Button>
            )}
          </div>
        </main>

        <Dialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Terminer l'examen ?</DialogTitle>
              <DialogDescription>
                {unansweredCount > 0
                  ? `Il vous reste ${unansweredCount} question${unansweredCount > 1 ? 's' : ''} sans réponse. Elles seront comptées comme incorrectes. Voulez-vous vraiment terminer ?`
                  : "Vous avez répondu à toutes les questions. Voir votre score ?"}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setConfirmSubmitOpen(false)} className="rounded-2xl font-black text-sm">
                Continuer l'examen
              </Button>
              <Button
                onClick={() => { setConfirmSubmitOpen(false); submitExam(); }}
                className="bg-emerald-600 text-white rounded-2xl font-black text-sm"
              >
                Terminer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // === FIN DE SESSION SRS ===
  if (mode === "training" && finished) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8 max-w-md w-full">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
            <Trophy size={36} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Session terminée !</h2>
            <p className="text-sm text-zinc-500 font-medium">{sessionCorrect} / {questions.length} bonnes réponses.</p>
          </div>
          {!currentUser && (
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-center space-y-1.5">
              <p className="text-xs text-indigo-700 font-bold leading-relaxed">
                Créez un compte gratuit pour sauvegarder votre progression et découvrir la préparation TEF IRN.
              </p>
              <Link href="/tef-irn/login?from=examen_civique" className="inline-block text-xs font-black text-indigo-600 hover:underline">
                Créer mon compte →
              </Link>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <Button onClick={handleBackToSelection} className="h-12 bg-zinc-900 text-white rounded-2xl font-black text-sm">
              Retour à l'accueil
            </Button>
            <Button
              variant="ghost"
              onClick={() => startTraining(false)}
              className="h-12 text-zinc-400 font-black uppercase tracking-widest text-[10px] hover:text-zinc-900"
            >
              <RotateCcw size={14} className="mr-2" /> Recommencer une session
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // === CATALOGUE NAVIGABLE ===
  if (mode === "catalogue") {
    const statusConfig = {
      new: { label: "Nouveau", className: "bg-zinc-100 text-zinc-500" },
      learning: { label: "En cours", className: "bg-amber-50 text-amber-600" },
      mastered: { label: "Maîtrisé", className: "bg-emerald-50 text-emerald-600" },
    };

    // Regroupe les questions par thématique (l'ordre des groupes suit THEMES pour rester stable).
    const groupedByTheme = THEMES.map((t) => ({
      theme: t,
      items: catalogueQuestions.filter((q) => q.theme === t.value),
    })).filter((g) => g.items.length > 0);

    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="max-w-4xl mx-auto px-6 py-8 lg:px-10">
          <ExerciseLayout
            variant="compact"
            title="CATALOGUE"
            badge={
              theme !== "Toutes"
                ? `${THEMES.find((t) => t.value === theme)?.label} — ${catalogueQuestions.length} question${catalogueQuestions.length > 1 ? "s" : ""}`
                : `${catalogueQuestions.length} question${catalogueQuestions.length > 1 ? "s" : ""}`
            }
            badgeColor="indigo"
            onBack={handleBackToSelection}
          />

          {catalogueQuestions.length === 0 ? (
            <div className="mt-8 p-12 text-center border-2 border-dashed border-zinc-200 rounded-[2.5rem] text-zinc-400 font-bold text-sm">
              Aucune question ne correspond à ces filtres.
            </div>
          ) : (
            <div className="mt-6 space-y-8">
              {groupedByTheme.map((group) => (
                <section key={group.theme.value}>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-sm font-black uppercase tracking-tight text-zinc-900">{group.theme.label}</h2>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      {group.items.length} question{group.items.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <Accordion className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm divide-y divide-zinc-50 px-6">
                    {group.items.map((q) => {
                      const status = catalogueStatus[q.id] || "new";
                      return (
                        <AccordionItem key={q.id} value={q.id} className="border-none">
                          <AccordionTrigger className="hover:no-underline py-4 gap-4">
                            <div className="flex items-center gap-3 text-left flex-1">
                              <Badge className={`shrink-0 border-none rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase ${statusConfig[status].className}`}>
                                {statusConfig[status].label}
                              </Badge>
                              <span className="text-sm font-bold text-zinc-800">{q.question}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-5 space-y-3 pl-1">
                            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-sm">
                              {q.correct_answer}
                            </div>
                            {q.explanation && <p className="text-xs text-zinc-500 italic leading-relaxed">{q.explanation}</p>}
                            {q.source_url && (
                              <a href={q.source_url} target="_blank" rel="noopener noreferrer" className="inline-block text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:underline">
                                Source officielle →
                              </a>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // === MODE ENTRAÎNEMENT (learn -> quiz) ===
  if (mode === "training") {
    const current = questions[index];
    const progress = questions.length > 0 ? ((index + 1) / questions.length) * 100 : 0;

    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col">
        <ExerciseLayout
          variant="compact"
          title="EXAMEN CIVIQUE"
          badge="Révision SRS"
          badgeColor="indigo"
          onBack={handleBackToSelection}
          rightElement={
            <div className="text-right">
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Progression</div>
              <div className="text-lg font-black text-zinc-900">{index + 1} / {questions.length}</div>
            </div>
          }
        />

        <main className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8">
          <AnimatePresence mode="wait">
            {step === "learn" && (
              <motion.div
                key="learn"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="w-full max-w-xl space-y-6"
              >
                <Card className="p-8 rounded-[2.5rem] border-none shadow-2xl shadow-zinc-200 bg-white space-y-4">
                  <Badge className="bg-indigo-50 text-indigo-600 border-none rounded-full px-3 py-1 text-[10px] font-black uppercase">
                    {THEMES.find(t => t.value === current?.theme)?.label || current?.theme}
                  </Badge>
                  <h2 className="text-lg font-black text-zinc-900 leading-snug">{current?.question}</h2>
                  <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-800 font-bold text-sm">
                    {current?.correct_answer}
                  </div>
                  {current?.explanation && (
                    <p className="text-sm text-zinc-500 italic leading-relaxed">{current.explanation}</p>
                  )}
                  {current?.source_url && (
                    <a href={current.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:underline">
                      Source officielle →
                    </a>
                  )}
                </Card>
                <div className="flex gap-4">
                  <Button
                    onClick={handleSkip}
                    variant="secondary"
                    className="h-12 flex-1 bg-zinc-100 text-zinc-600 font-black rounded-2xl text-sm hover:bg-zinc-200"
                  >
                    Passer
                  </Button>
                  <Button onClick={handleReadyForQuiz} className="h-12 flex-[2] bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 text-sm">
                    Je suis prêt(e), tester ma mémoire <ArrowRight className="ml-2" size={16} />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "quiz" && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full max-w-xl space-y-6"
              >
                <div className="text-center space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sélectionnez la bonne réponse</p>
                  <h2 className="text-lg font-black text-zinc-900 leading-snug">{current?.question}</h2>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {quizOptions.map((opt, i) => (
                    <button
                      key={i}
                      disabled={checked}
                      onClick={() => setSelectedOption(opt)}
                      className={`w-full p-4 rounded-2xl border-2 text-left font-bold text-sm transition-all ${
                        selectedOption === opt ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-zinc-100 bg-white text-zinc-600 hover:border-zinc-300'
                      } ${checked && opt === current?.correct_answer ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : ''}
                      ${checked && selectedOption === opt && opt !== current?.correct_answer ? 'border-rose-500 bg-rose-50 text-rose-900' : ''}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {!checked ? (
                  <Button disabled={!selectedOption} onClick={handleCheck} className="w-full h-12 bg-zinc-900 text-white font-black rounded-2xl text-sm">
                    Vérifier
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className={`flex items-center gap-2 justify-center p-3 rounded-xl font-bold text-sm ${selectedOption === current?.correct_answer ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {selectedOption === current?.correct_answer ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                      {selectedOption === current?.correct_answer ? "Bonne réponse !" : "Pas tout à fait"}
                    </div>
                    {current?.explanation && (
                      <p className="text-xs text-zinc-500 italic text-center leading-relaxed px-4">{current.explanation}</p>
                    )}
                    <Button onClick={handleNext} className="w-full h-12 bg-indigo-600 text-white font-black rounded-2xl text-sm">
                      Continuer <ArrowRight className="ml-2" size={16} />
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    );
  }

  // === ÉCRAN DE SÉLECTION ===
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-10">
        <ExerciseLayout
          title="EXAMEN CIVIQUE"
          badge="CSP • CR • Naturalisation"
          badgeColor="indigo"
          description="Préparez l'entretien civique avec les questions officielles du gouvernement, une révision quotidienne intelligente et des examens blancs chronométrés."
        >
          {resumableSession && (
            <div className="mb-6 p-5 rounded-[2rem] bg-amber-50 border-2 border-amber-200 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-black text-amber-900">Un examen blanc est en cours ({mentionLabel(resumableSession.mention)})</p>
                <p className="text-xs text-amber-700 font-medium">
                  Interrompu, il reste {formatTime(Math.max(0, Math.round((resumableSession.examEndAt - Date.now()) / 1000)))} avant la fin du temps imparti.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={abandonResumableExam} className="h-10 bg-white text-amber-700 font-black rounded-xl text-xs border border-amber-200">
                  Abandonner
                </Button>
                <Button onClick={resumeExam} className="h-10 bg-amber-600 text-white font-black rounded-xl text-xs">
                  Reprendre l'examen
                </Button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">
              {errorMsg}
            </div>
          )}

          {/* Distinction principale : 2 modes, un choix à faire avant tout le reste */}
          <div className="flex gap-2 p-1.5 bg-zinc-100 rounded-2xl w-fit mb-6">
            <button
              onClick={() => setSelectorTab("training")}
              className={`flex items-center gap-2 h-11 px-5 rounded-xl font-black text-sm transition-all ${selectorTab === "training" ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'}`}
            >
              <Brain size={16} /> S'entraîner
            </button>
            <button
              onClick={() => setSelectorTab("exam")}
              className={`flex items-center gap-2 h-11 px-5 rounded-xl font-black text-sm transition-all ${selectorTab === "exam" ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400'}`}
            >
              <Clock size={16} /> Examen blanc
            </button>
          </div>

          {selectorTab === "training" ? (
            <>
              <p className="text-sm text-zinc-500 font-medium mb-6 -mt-2">
                Apprenez à votre rythme : les questions s'adaptent à ce que vous savez déjà et reviennent au bon moment pour mémoriser durablement.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 space-y-4 shadow-sm lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <Landmark size={14} className="text-indigo-600" /> Mention visée
                    </div>
                    <button
                      onClick={() => setMentionHelpOpen(true)}
                      className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:underline"
                    >
                      Quelle mention me concerne ?
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {MENTIONS.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setMention(m.value)}
                        title={m.subtitle}
                        className={`flex-1 h-14 px-2 rounded-2xl font-black text-sm transition-all leading-tight ${mention === m.value ? 'bg-indigo-600 text-white shadow-lg' : 'bg-zinc-50 text-zinc-400'}`}
                      >
                        <div>{m.label}</div>
                        {m.subtitle && (
                          <div className={`text-[9px] font-bold normal-case tracking-normal ${mention === m.value ? 'text-indigo-100' : 'text-zinc-400'}`}>
                            {m.subtitle}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 space-y-4 lg:col-span-2 shadow-sm">
                  <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Target size={14} className="text-indigo-600" /> Thématique
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["Toutes", ...THEMES.map(t => t.value)].map((val) => (
                      <button
                        key={val}
                        onClick={() => setTheme(val)}
                        className={`px-4 h-10 rounded-2xl font-black text-xs transition-all ${theme === val ? 'bg-zinc-900 text-white shadow-lg' : 'bg-zinc-50 text-zinc-400'}`}
                      >
                        {val === "Toutes" ? "Toutes" : THEMES.find(t => t.value === val)?.label}
                      </button>
                    ))}
                  </div>
                  {filteredCount !== null && (
                    <p className="text-[10px] font-bold text-zinc-400">
                      {filteredCount} question{filteredCount > 1 ? "s" : ""} disponible{filteredCount > 1 ? "s" : ""} pour cette sélection —{" "}
                      <button onClick={openCatalogue} disabled={catalogueLoading} className="text-indigo-500 hover:underline font-black disabled:opacity-50">
                        {catalogueLoading ? "Chargement..." : "parcourir le catalogue"}
                      </button>
                    </p>
                  )}
                </div>
              </div>

              <div
                onClick={() => startTraining(true)}
                className="mt-4 bg-indigo-600 p-6 rounded-[2.5rem] text-white space-y-2 shadow-2xl shadow-indigo-100 relative overflow-hidden group cursor-pointer hover:scale-[1.01] transition-transform"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
                  <Brain size={14} /> Mode Intelligent (SRS)
                </div>
                <h4 className="text-lg font-black leading-tight">
                  {dueCount ? `${dueCount} question${dueCount > 1 ? 's' : ''} à réviser` : "Lancer une session de révision"}
                </h4>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-zinc-500 font-medium mb-6 -mt-2">
                En conditions réelles, chronométré, sans indice ni pause : le format exact du jour J.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <Landmark size={14} className="text-indigo-600" /> Mention visée
                    </div>
                    <button
                      onClick={() => setMentionHelpOpen(true)}
                      className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:underline"
                    >
                      Quelle mention me concerne ?
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {MENTIONS.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setMention(m.value)}
                        title={m.subtitle}
                        className={`flex-1 h-14 px-2 rounded-2xl font-black text-sm transition-all leading-tight ${mention === m.value ? 'bg-indigo-600 text-white shadow-lg' : 'bg-zinc-50 text-zinc-400'}`}
                      >
                        <div>{m.label}</div>
                        {m.subtitle && (
                          <div className={`text-[9px] font-bold normal-case tracking-normal ${mention === m.value ? 'text-indigo-100' : 'text-zinc-400'}`}>
                            {m.subtitle}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  onClick={() => setExamModalOpen(true)}
                  className="bg-zinc-900 p-6 rounded-[2.5rem] text-white space-y-2 shadow-2xl shadow-zinc-200 relative overflow-hidden group cursor-pointer hover:scale-[1.01] transition-transform"
                >
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <Clock size={14} /> Conditions réelles
                  </div>
                  <h4 className="text-lg font-black leading-tight">
                    {EXAM_QUESTION_COUNT} questions • 45 minutes
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400">
                    Seuil de réussite : {EXAM_PASS_THRESHOLD}/{EXAM_QUESTION_COUNT} — Démarrer l'examen blanc
                  </div>
                </div>
              </div>
            </>
          )}
          {attempts.length > 0 && (
            <section className="mt-8">
              <h2 className="text-base font-black text-zinc-900 uppercase tracking-tight mb-4">
                Historique de mes examens blancs
              </h2>
              <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm divide-y divide-zinc-50">
                {attempts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${a.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {a.passed ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-black text-zinc-900">
                          {a.score} / {a.total_questions} — {mentionLabel(a.mention)}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                          {formatAttemptDate(a.created_at)}
                          {a.duration_seconds ? ` • ${formatTime(a.duration_seconds)}` : ""}
                        </p>
                      </div>
                    </div>
                    <Badge className={`border-none rounded-full px-3 py-1 text-[10px] font-black uppercase ${a.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {a.passed ? "Réussi" : "Échoué"}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>
          )}
        </ExerciseLayout>
      </div>

      <Dialog open={examModalOpen} onOpenChange={setExamModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Démarrer l'examen blanc</DialogTitle>
            <DialogDescription>
              {EXAM_QUESTION_COUNT} questions officielles, mention « {mentionLabel(mention)} ». Vous avez 45 minutes, sans possibilité de mettre en pause. Le score de réussite est de {EXAM_PASS_THRESHOLD}/{EXAM_QUESTION_COUNT}.
            </DialogDescription>
          </DialogHeader>
          {examPoolCount !== null && examPoolCount < EXAM_QUESTION_COUNT && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
              Seulement {examPoolCount} question{examPoolCount > 1 ? "s" : ""} disponible{examPoolCount > 1 ? "s" : ""} pour cette mention : l'examen en comptera {examPoolCount} au lieu de {EXAM_QUESTION_COUNT} (seuil de réussite ajusté à {passThresholdFor(examPoolCount)}/{examPoolCount}).
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setExamModalOpen(false)} className="rounded-2xl font-black text-sm">
              Annuler
            </Button>
            <Button onClick={startExam} disabled={loading} className="bg-indigo-600 text-white rounded-2xl font-black text-sm">
              {loading ? <Loader2 className="animate-spin" size={16} /> : "C'est parti"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mentionHelpOpen} onOpenChange={setMentionHelpOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Quelle mention me concerne ?</DialogTitle>
            <DialogDescription>
              Depuis le 1er janvier 2026, l'examen civique est obligatoire pour toute <strong>première</strong> demande de titre de séjour pluriannuel ou de naturalisation (les renouvellements ne sont pas concernés). Il existe 3 versions, de difficulté croissante :
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-zinc-50 space-y-1">
              <p className="text-sm font-black text-zinc-900">CSP — Carte de séjour pluriannuelle</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Pour votre <strong>première</strong> carte de séjour pluriannuelle (2 à 4 ans), par exemple après une carte de séjour temporaire. Niveau de français requis : A2.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 space-y-1">
              <p className="text-sm font-black text-zinc-900">CR — Carte de résident</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Pour votre <strong>première</strong> carte de résident (10 ans). Niveau de français requis : B1, plus exigeant que pour la CSP.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50 space-y-1">
              <p className="text-sm font-black text-zinc-900">Naturalisation</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Pour une demande de nationalité française par décret ou par mariage. Niveau de français requis : B2. Ne remplace pas l'entretien en préfecture, qui reste nécessaire.
              </p>
            </div>
          </div>
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            Certaines situations sont exemptées (protection internationale, plus de 65 ans, certains accords bilatéraux...). En cas de doute sur votre situation personnelle, vérifiez sur{" "}
            <a href="https://www.service-public.gouv.fr/particuliers/vosdroits/F39530" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline font-bold">
              service-public.gouv.fr
            </a>{" "}
            ou avec votre préfecture.
          </p>
          <DialogFooter>
            <Button onClick={() => setMentionHelpOpen(false)} className="bg-zinc-900 text-white rounded-2xl font-black text-sm">
              Compris
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ExamenCivique() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-zinc-50"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>}>
      <CivicExamContent />
    </Suspense>
  );
}
