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
  getCivicStreakData,
  recordCivicSession,
  getLocalStats,
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
  const [civicStreak, setCivicStreak] = useState(0);
  const [localStats, setLocalStats] = useState<{ seen: number; mastered: number; scheduled: number }>({ seen: 0, mastered: 0, scheduled: 0 });
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [showAllAttempts, setShowAllAttempts] = useState(false);
  const [mention, setMention] = useState("naturalisation");
  // Calculé à chaque rendu : vrai pour les anonymes ET les connectés sans abonnement premium.
  // Déclaré ici (pas dans le bloc exam_finished) pour être accessible dans tous les modes de rendu.
  const [theme, setTheme] = useState<string>("Toutes");
  const [mode, setMode] = useState<Mode>("selection");
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

  // Constantes dérivées des états — après tous les useState/useRef pour éviter les erreurs
  // "used before declaration". Accessibles dans tous les blocs de rendu (exam_finished, training, etc.)
  const showCTATef = !currentUser || subscriptionTier === "free" || subscriptionTier === null;
  const hasDue = (dueCount ?? 0) > 0;
  const hasSeenQuestions = localStats.seen > 0;
  const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : null;
  const totalAttempts = attempts.length;
  const avgSuccessRate = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.score / a.total_questions, 0) / attempts.length * 100)
    : null;

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

  // Initialise streak + métriques locales au premier rendu.
  useEffect(() => {
    setCivicStreak(getCivicStreakData().currentStreak);
    setLocalStats(getLocalStats());
  }, []);

  const refreshLocalStats = () => setLocalStats(getLocalStats());

  // Un visiteur anonyme avait de la progression locale (SRS + tentatives) et vient de se connecter
  // ou créer un compte : on la bascule vers Supabase avant qu'elle ne soit silencieusement perdue.
  useEffect(() => {
    if (!currentUser || !hasLocalCivicData()) return;
    migrateLocalCivicDataToSupabase(currentUser.id)
      .then(() => { fetchDueCount(); fetchAttempts(); refreshLocalStats(); })
      .catch((err) => console.error("Error migrating local civic data:", err));
  }, [currentUser, fetchDueCount, fetchAttempts]);

  // Charge le tier d'abonnement pour cibler les connectés sans abonnement premium.
  useEffect(() => {
    if (!currentUser) { setSubscriptionTier(null); return; }
    supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", currentUser.id)
      .single()
      .then(({ data }: { data: { subscription_tier: string } | null }) => {
        if (data) setSubscriptionTier(data.subscription_tier);
      });
  }, [currentUser, supabase]);

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
            setCivicStreak(recordCivicSession().currentStreak);
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
            setCivicStreak(recordCivicSession().currentStreak);
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
        setCivicStreak(recordCivicSession().currentStreak);
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
    else { updateLocalCivicSRS(current.id, isCorrect); refreshLocalStats(); }
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
      refreshLocalStats();
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
      setCivicStreak(recordCivicSession().currentStreak);
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

    const handleReviewTheme = (targetTheme: string) => {
      setTheme(targetTheme);
      startTraining(false);
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
              const isWeak = pct < 80;
              return (
                <div key={themeVal} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-700">
                    <span>{THEMES.find((t) => t.value === themeVal)?.label || themeVal}</span>
                    <div className="flex items-center gap-2">
                      <span>{stats.correct}/{stats.total}</span>
                      {isWeak && (
                        <button
                          onClick={() => handleReviewTheme(themeVal)}
                          className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest"
                        >
                          Réviser →
                        </button>
                      )}
                    </div>
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

          {showCTATef && (
            <div className="p-6 rounded-[2rem] bg-indigo-600 space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-black text-white">
                  {examResult.passed
                    ? "L'examen civique est fait. Et le TEF IRN ?"
                    : "Préparez aussi votre niveau de français."}
                </p>
                <p className="text-xs text-indigo-200 font-medium leading-relaxed">
                  Votre démarche {mentionLabel(mention)} exige le niveau {MENTION_TO_LEVEL[mention] || "B1"} (TEF IRN).
                  Coach IA oral &amp; écrit, exercices adaptatifs — dès 55 €/mois.
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={currentUser ? "/tef-irn/dashboard" : "/tef-irn/login?from=examen_civique_result"} className="flex-1">
                  <Button className="w-full h-11 bg-white text-indigo-700 rounded-2xl font-black text-sm hover:bg-indigo-50">
                    {currentUser ? "Accéder au TEF IRN" : "Essayer gratuitement"} <ArrowRight className="ml-2" size={15} />
                  </Button>
                </Link>
                <Link href="/tef-irn/pricing">
                  <Button variant="secondary" className="h-11 px-4 bg-indigo-500 border-none text-white rounded-2xl font-black text-sm hover:bg-indigo-400">
                    Tarifs
                  </Button>
                </Link>
              </div>
              {!currentUser && (
                <p className="text-[10px] text-indigo-300 font-bold text-center">
                  Votre progression civique sera automatiquement sauvegardée à la création de compte.
                </p>
              )}
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
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                {answeredCount}/{questions.length}
              </span>
              <div className={`flex items-center gap-2 font-black text-sm ${examTimeLeft < 300 ? 'text-rose-600' : 'text-zinc-900'}`}>
                <Clock size={16} /> {formatTime(examTimeLeft)}
              </div>
            </div>
          </div>
          {/* Barre de progression globale */}
          <div className="max-w-4xl mx-auto mt-2">
            <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto p-4 lg:p-8 space-y-6">
          {/* Grille de navigation — 3 états visuellement distincts */}
          <div className="flex flex-wrap gap-2">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-8 h-8 rounded-lg text-[11px] font-black transition-all ${
                  i === index
                    ? 'bg-zinc-900 text-white ring-2 ring-zinc-900 ring-offset-1'
                    : examAnswers[i]
                      ? 'bg-emerald-500 text-white'
                      : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'
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
          {showCTATef && (
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-center space-y-2">
              <p className="text-xs text-indigo-800 font-bold leading-relaxed">
                Créez un compte gratuit pour ne pas perdre cette progression.
              </p>
              <p className="text-[11px] text-indigo-500 font-medium">
                Vous préparez aussi le TEF IRN ? Découvrez LlamaKusi.
              </p>
              <Link href="/tef-irn/login?from=examen_civique_srs" className="inline-block text-xs font-black text-indigo-600 hover:underline">
                Créer mon compte gratuitement →
              </Link>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {/* Priorité 1 : si des révisions sont maintenant dues (après la session Apprendre), les proposer */}
            {hasDue && (
              <Button
                onClick={() => startTraining(true)}
                className="h-12 bg-indigo-600 text-white rounded-2xl font-black text-sm"
              >
                Mémoriser — {dueCount} révision{dueCount! > 1 ? "s" : ""} prévue{dueCount! > 1 ? "s" : ""} <ArrowRight className="ml-2" size={16} />
              </Button>
            )}
            {/* Priorité 2 : si bon score et pas de révisions dues → examen blanc */}
            {!hasDue && sessionCorrect / questions.length >= 0.8 ? (
              <Button
                onClick={() => setExamModalOpen(true)}
                className="h-12 bg-emerald-600 text-white rounded-2xl font-black text-sm"
              >
                Tester avec un examen blanc <ArrowRight className="ml-2" size={16} />
              </Button>
            ) : !hasDue ? (
              <Button
                onClick={() => startTraining(false)}
                className="h-12 bg-indigo-600 text-white rounded-2xl font-black text-sm"
              >
                Continuer à apprendre <ArrowRight className="ml-2" size={16} />
              </Button>
            ) : null}
            <Button onClick={handleBackToSelection} variant="secondary" className="h-12 bg-zinc-100 text-zinc-600 rounded-2xl font-black text-sm">
              Retour à l'accueil
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
          badge="Révision programmée"
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
      <div className="max-w-2xl mx-auto px-5 py-8 lg:px-6 space-y-6">

        {/* En-tête */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-zinc-900 tracking-tighter leading-tight">
            Préparez votre entretien civique
          </h1>
          <p className="text-sm text-zinc-500 font-medium leading-relaxed">
            Obligatoire depuis janvier 2026 (CSP, carte de résident, naturalisation).
            {filteredCount !== null && (
              <> {filteredCount} questions officielles disponibles.</>
            )}
          </p>
        </div>

        {/* Réassurance — gratuité + source officielle */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-2xl border border-zinc-100 p-3 text-center space-y-1">
            <p className="text-lg">🆓</p>
            <p className="text-[10px] font-black text-zinc-700 leading-tight">100 % gratuit</p>
            <p className="text-[9px] text-zinc-400 font-medium leading-tight">Sans inscription requise</p>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-100 p-3 text-center space-y-1">
            <p className="text-lg">🏛️</p>
            <p className="text-[10px] font-black text-zinc-700 leading-tight">Source officielle</p>
            <p className="text-[9px] text-zinc-400 font-medium leading-tight">Ministère de l'Intérieur</p>
          </div>
          <div className="bg-white rounded-2xl border border-zinc-100 p-3 text-center space-y-1">
            <p className="text-lg">🧠</p>
            <p className="text-[10px] font-black text-zinc-700 leading-tight">Révision adaptative</p>
            <p className="text-[9px] text-zinc-400 font-medium leading-tight">L'algo s'adapte à vous</p>
          </div>
        </div>

        {/* Résumé de progression — affiché dès qu'il y a des données */}
        {(hasSeenQuestions || bestScore !== null || civicStreak > 0) && (
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Votre progression</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {localStats.seen > 0 && filteredCount !== null && (
                <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 text-center">
                  <p className="text-xl font-black text-zinc-900">
                    {localStats.mastered}<span className="text-sm text-zinc-400 font-bold">/{filteredCount}</span>
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mt-0.5">Maîtrisées</p>
                </div>
              )}
              {localStats.seen > 0 && filteredCount === null && (
                <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 text-center">
                  <p className="text-xl font-black text-zinc-900">{localStats.seen}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-0.5">Question{localStats.seen > 1 ? "s" : ""} vues</p>
                </div>
              )}
              {civicStreak > 0 && (
                <div className="bg-orange-50 rounded-2xl border border-orange-100 p-4 text-center">
                  <p className="text-xl font-black text-orange-600">🔥 {civicStreak}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mt-0.5">Jour{civicStreak > 1 ? "s" : ""} de suite</p>
                </div>
              )}
              {bestScore !== null && (
                <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 text-center">
                  <p className="text-xl font-black text-zinc-900">{bestScore}<span className="text-xs text-zinc-400 font-bold">/{EXAM_QUESTION_COUNT}</span></p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-0.5">Meilleur score</p>
                </div>
              )}
              {avgSuccessRate !== null && totalAttempts >= 2 && (
                <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4 text-center">
                  <p className="text-xl font-black text-zinc-900">{avgSuccessRate}%</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-0.5">Taux de réussite</p>
                </div>
              )}
              {hasDue && (
                <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4 text-center">
                  <p className="text-xl font-black text-indigo-700">{dueCount}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mt-0.5">À réviser aujourd'hui</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bannière session interrompue */}
        {resumableSession && (
          <div className="p-5 rounded-[2rem] bg-amber-50 border-2 border-amber-200 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-black text-amber-900">Examen blanc en cours — {mentionLabel(resumableSession.mention)}</p>
              <p className="text-xs text-amber-700 font-medium">
                Il reste {formatTime(Math.max(0, Math.round((resumableSession.examEndAt - Date.now()) / 1000)))} avant la fin du temps imparti.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={abandonResumableExam} className="h-10 bg-white text-amber-700 font-black rounded-xl text-xs border border-amber-200">
                Abandonner
              </Button>
              <Button onClick={resumeExam} className="h-10 bg-amber-600 text-white font-black rounded-xl text-xs">
                Reprendre
              </Button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold">
            {errorMsg}
          </div>
        )}

        {/* Votre démarche */}
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <Landmark size={12} className="text-indigo-600" /> Votre démarche
            </p>
            <button onClick={() => setMentionHelpOpen(true)} className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:underline">
              Aide au choix →
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MENTIONS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMention(m.value)}
                className={`py-3 px-3 rounded-2xl font-black text-sm transition-all leading-tight text-center ${mention === m.value ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100'}`}
              >
                <div>{m.label}</div>
                {m.subtitle && (
                  <div className={`text-[9px] font-bold normal-case tracking-normal mt-0.5 ${mention === m.value ? 'text-indigo-200' : 'text-zinc-400'}`}>
                    {m.subtitle}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Comment se préparer ───────────────────────── */}
        <div className="space-y-2">
          <h2 className="text-base font-black text-zinc-900 px-1">Comment se préparer</h2>
          <p className="text-xs text-zinc-400 font-medium px-1 pb-1">
            Suivez les étapes dans l'ordre la première fois. Revenez ensuite directement à l'étape qui vous correspond.
          </p>

          {/* Étape 0 — Choisir la thématique */}
          <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-5 space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center text-[10px] font-black text-zinc-500 shrink-0 mt-0.5">0</span>
              <div>
                <p className="text-sm font-black text-zinc-900 flex items-center gap-2">
                  <Target size={14} className="text-zinc-400 shrink-0" /> Choisir une thématique
                </p>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                  Filtrez les questions par thème, ou travaillez sur toutes à la fois.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 pl-9">
              {["Toutes", ...THEMES.map(t => t.value)].map((val) => (
                <button
                  key={val}
                  onClick={() => setTheme(val)}
                  className={`px-3 h-7 rounded-xl font-black text-[10px] transition-all ${theme === val ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
                >
                  {val === "Toutes" ? "Toutes" : THEMES.find(t => t.value === val)?.label}
                </button>
              ))}
            </div>
            {filteredCount !== null && (
              <p className="text-[10px] font-bold text-zinc-400 pl-9">
                {filteredCount} question{filteredCount > 1 ? "s" : ""} pour cette sélection
              </p>
            )}
          </div>

          {/* Étape 1 — Parcourir */}
          <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-5 flex items-start gap-3">
            <span className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center text-[10px] font-black text-zinc-500 shrink-0 mt-0.5">1</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-zinc-900 flex items-center gap-2">
                    <BookOpen size={14} className="text-zinc-400 shrink-0" /> Parcourir les questions
                  </p>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5 leading-relaxed">
                    Lisez les Q&R avant de vous tester. Idéal pour découvrir une thématique ou vérifier rapidement une réponse.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={openCatalogue}
                  disabled={catalogueLoading}
                  className="h-9 px-4 bg-zinc-100 text-zinc-700 rounded-xl font-black text-xs shrink-0 hover:bg-zinc-200"
                >
                  {catalogueLoading ? <Loader2 className="animate-spin" size={14} /> : "Ouvrir →"}
                </Button>
              </div>
            </div>
          </div>

          {/* Étape 2 — Apprendre */}
          <div
            onClick={() => startTraining(false)}
            className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-5 flex items-start gap-3 cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all group"
          >
            <span className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600 shrink-0 mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">2</span>
            <div className="flex-1">
              <p className="text-sm font-black text-zinc-900 flex items-center gap-2">
                <BookOpen size={14} className="text-indigo-500 shrink-0" /> Apprendre
              </p>
              <p className="text-xs text-zinc-500 font-medium mt-0.5 leading-relaxed">
                Nouvelles questions de la thématique choisie. On vous montre la réponse, puis on vous teste immédiatement. Pas de quiz à l'aveugle.
              </p>
            </div>
            <ArrowRight size={15} className="text-zinc-300 group-hover:text-indigo-500 shrink-0 mt-1 transition-colors" />
          </div>

          {/* Étape 3 — Mémoriser (révisions programmées) */}
          {hasDue ? (
            <div
              onClick={() => startTraining(true)}
              className="bg-indigo-600 rounded-[2rem] p-5 flex items-start gap-3 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-xl pointer-events-none" />
              <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-[10px] font-black text-white shrink-0 mt-0.5">3</span>
              <div className="flex-1">
                <p className="text-sm font-black text-white flex items-center gap-2">
                  <Brain size={14} className="shrink-0" /> Mémoriser — {dueCount} révision{dueCount! > 1 ? "s" : ""} prévue{dueCount! > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-indigo-200 font-medium mt-0.5 leading-relaxed">
                  Questions déjà vues qui reviennent au bon moment. L'algorithme planifie chaque révision selon vos réponses.
                </p>
              </div>
              <ArrowRight size={15} className="text-indigo-200 shrink-0 mt-1" />
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] border border-dashed border-zinc-200 p-5 flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center text-[10px] font-black text-zinc-400 shrink-0 mt-0.5">3</span>
              <div className="flex-1">
                <p className="text-sm font-black text-zinc-400 flex items-center gap-2">
                  <Brain size={14} className="shrink-0" /> Mémoriser
                </p>
                {hasSeenQuestions ? (
                  <>
                    <p className="text-xs text-zinc-400 font-medium mt-0.5 leading-relaxed">
                      {localStats.scheduled > 0
                        ? `${localStats.scheduled} révision${localStats.scheduled > 1 ? "s" : ""} programmée${localStats.scheduled > 1 ? "s" : ""} — revenez demain pour les retrouver ici.`
                        : "Tout est à jour — revenez demain pour vos prochaines révisions."}
                    </p>
                    <p className="text-[10px] text-zinc-400 font-medium mt-2 leading-relaxed">
                      💡 Comment ça marche : après chaque bonne réponse, l'algorithme planifie la question dans 1, 6, puis X jours. Plus vous répondez juste, plus l'intervalle s'allonge. C'est ce qui fait mémoriser durablement.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-zinc-400 font-medium mt-0.5 leading-relaxed">
                    Disponible après vos premières sessions Apprendre. L'algorithme planifiera vos révisions au moment le plus efficace.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Étape 4 — Examen blanc */}
          <div
            onClick={() => setExamModalOpen(true)}
            className="bg-zinc-900 rounded-[2rem] p-5 flex items-start gap-3 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-xl pointer-events-none" />
            <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-black text-zinc-300 shrink-0 mt-0.5">4</span>
            <div className="flex-1">
              <p className="text-sm font-black text-white flex items-center gap-2">
                <Clock size={14} className="shrink-0" /> Examen blanc
              </p>
              <p className="text-xs text-zinc-400 font-medium mt-0.5 leading-relaxed">
                {EXAM_QUESTION_COUNT} questions, 45 minutes, conditions réelles. Seuil de réussite : {EXAM_PASS_THRESHOLD}/{EXAM_QUESTION_COUNT}.
                {bestScore !== null && <span className="text-zinc-300"> Votre meilleur : {bestScore}/{EXAM_QUESTION_COUNT}.</span>}
              </p>
            </div>
            <ArrowRight size={15} className="text-zinc-500 shrink-0 mt-1" />
          </div>
        </div>

        {/* Historique */}
        {attempts.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Historique des examens blancs</p>
            <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm divide-y divide-zinc-50">
              {(showAllAttempts ? attempts : attempts.slice(0, 5)).map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${a.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                      {a.passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-zinc-900">
                        {a.score}/{a.total_questions}
                        <span className="ml-2 text-zinc-400 font-bold text-xs">{mentionLabel(a.mention)}</span>
                      </p>
                      <p className="text-[10px] font-bold text-zinc-400">
                        {formatAttemptDate(a.created_at)}
                        {a.duration_seconds ? ` • ${formatTime(a.duration_seconds)}` : ""}
                      </p>
                    </div>
                  </div>
                  <Badge className={`border-none rounded-full px-3 py-1 text-[10px] font-black uppercase ${a.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                    {a.passed ? "Réussi" : "Échoué"}
                  </Badge>
                </div>
              ))}
            </div>
            {attempts.length > 5 && (
              <button
                onClick={() => setShowAllAttempts((prev) => !prev)}
                className="w-full text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-700 py-1 transition-colors"
              >
                {showAllAttempts ? "Voir moins ↑" : `Voir les ${attempts.length - 5} autres examens ↓`}
              </button>
            )}
          </div>
        )}

        {/* ── Séparateur + CTA TEF IRN ─────────────────── */}
        {showCTATef && (
          <>
            <div className="border-t border-zinc-200" />
            <div className="rounded-[2rem] bg-zinc-100 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-black text-zinc-800">Vous devez aussi passer le TEF IRN ?</p>
                <p className="text-xs text-zinc-500 font-medium">
                  Niveau {MENTION_TO_LEVEL[mention] || "B1"} requis • Coach IA oral &amp; écrit • dès 55 €/mois
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link href="/tef-irn/pricing">
                  <Button variant="secondary" className="h-9 px-4 bg-white border border-zinc-200 text-zinc-600 rounded-xl font-black text-xs hover:bg-zinc-50">
                    Tarifs
                  </Button>
                </Link>
                <Link href={currentUser ? "/tef-irn/dashboard" : "/tef-irn/login?from=examen_civique"}>
                  <Button className="h-9 px-4 bg-indigo-600 text-white rounded-xl font-black text-xs">
                    {currentUser ? "Accéder au TEF IRN" : "Essayer gratuitement"} <ArrowRight className="ml-1" size={12} />
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}

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

export function CivicExamApp() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-zinc-50"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>}>
      <CivicExamContent />
    </Suspense>
  );
}
