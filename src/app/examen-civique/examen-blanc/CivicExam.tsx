"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { useCivicContext } from "@/components/features/examen-civique/useCivicContext";
import { useShowCivicTefBridge } from "@/components/features/examen-civique/useShowCivicTefBridge";
import { ExerciseLayout } from "@/components/shared/ExerciseLayout";
import {
  THEMES,
  MENTIONS,
  MENTION_TO_LEVEL,
  EXAM_QUESTION_COUNT,
  EXAM_DURATION_SECONDS,
  EXAM_PASS_THRESHOLD,
  EXAM_STORAGE_KEY,
  EXAM_MISTAKES_STORAGE_KEY,
  mentionLabel,
  passThresholdFor,
} from "@/lib/civic-constants";
import { updateCivicSRS } from "@/lib/civic-srs-engine";
import { addLocalAttempt, updateLocalCivicSRS, getLastLocalAttemptForMention, recordCivicSession } from "@/lib/civic-local-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Trophy, Clock, ArrowRight, CheckCircle2, XCircle, LogOut } from "lucide-react";

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

interface PersistedExamSession {
  mention: string;
  questions: CivicQuestion[];
  examAnswers: Record<number, string>;
  examEndAt: number;
  examStartedAt: number;
}

type ExamPhase = "loading" | "resumable" | "config" | "exam" | "finished";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => 0.5 - Math.random());
}

// Tire `total` questions en répartissant équitablement entre les thématiques présentes dans `pool`,
// plutôt qu'un tirage aléatoire pur qui pourrait sur-représenter la thématique la plus fournie.
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

async function recordAttempt(
  supabase: ReturnType<typeof createClient>,
  mention: string,
  qs: CivicQuestion[],
  answers: Record<number, string>,
  score: number,
  passed: boolean,
  duration: number | null
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { error } = await supabase.from("civic_exam_attempts").insert({
      user_id: user.id,
      mention,
      score,
      total_questions: qs.length,
      passed,
      duration_seconds: duration,
      question_ids: qs.map((q) => q.id),
    });
    if (error) throw error;
    await Promise.all(qs.map((q, i) => updateCivicSRS(user.id, q.id, answers[i] === q.correct_answer)));
  } else {
    addLocalAttempt({ mention, score, total_questions: qs.length, passed, duration_seconds: duration, question_ids: qs.map((q) => q.id) });
    qs.forEach((q, i) => updateLocalCivicSRS(q.id, answers[i] === q.correct_answer));
  }
}

function CivicExamContent() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const { mention, setMention } = useCivicContext();
  const showCTATef = useShowCivicTefBridge();

  const [phase, setPhase] = useState<ExamPhase>("loading");
  const [resumableSession, setResumableSession] = useState<PersistedExamSession | null>(null);
  const [examPoolCount, setExamPoolCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [questions, setQuestions] = useState<CivicQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [examAnswers, setExamAnswers] = useState<Record<number, string>>({});
  const [examEndAt, setExamEndAt] = useState<number | null>(null);
  const [examStartedAt, setExamStartedAt] = useState<number | null>(null);
  const [examTimeLeft, setExamTimeLeft] = useState(EXAM_DURATION_SECONDS);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [examResult, setExamResult] = useState<{
    score: number;
    passed: boolean;
    themeBreakdown: Record<string, { correct: number; total: number }>;
    saveFailed?: boolean;
  } | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answersRef = useRef(examAnswers);
  const questionsRef = useRef<CivicQuestion[]>([]);
  useEffect(() => { answersRef.current = examAnswers; }, [examAnswers]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);

  // Détecte une session interrompue (refresh, crash d'onglet...) au chargement : reprise si le
  // temps n'est pas écoulé, soumission automatique sinon (l'utilisateur voit alors son résultat).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(EXAM_STORAGE_KEY);
    if (!raw) { setPhase("config"); return; }
    try {
      const saved: PersistedExamSession = JSON.parse(raw);
      if (!saved?.questions?.length || !saved?.examEndAt) {
        window.localStorage.removeItem(EXAM_STORAGE_KEY);
        setPhase("config");
        return;
      }
      if (Date.now() >= saved.examEndAt) {
        (async () => {
          const score = saved.questions.reduce((acc, q, i) => acc + (saved.examAnswers[i] === q.correct_answer ? 1 : 0), 0);
          const passed = score >= passThresholdFor(saved.questions.length);
          const duration = Math.round((saved.examEndAt - saved.examStartedAt) / 1000);
          const themeBreakdown: Record<string, { correct: number; total: number }> = {};
          saved.questions.forEach((q, i) => {
            const isCorrect = saved.examAnswers[i] === q.correct_answer;
            if (!themeBreakdown[q.theme]) themeBreakdown[q.theme] = { correct: 0, total: 0 };
            themeBreakdown[q.theme].total += 1;
            if (isCorrect) themeBreakdown[q.theme].correct += 1;
          });
          let saveFailed = false;
          try {
            await recordAttempt(supabase, saved.mention, saved.questions, saved.examAnswers, score, passed, duration);
          } catch (err) {
            console.error("Error auto-submitting expired civic exam session:", err);
            saveFailed = true;
          }
          window.localStorage.removeItem(EXAM_STORAGE_KEY);
          setQuestions(saved.questions);
          setExamAnswers(saved.examAnswers);
          setExamResult({ score, passed, themeBreakdown, saveFailed });
          setPhase("finished");
        })();
      } else {
        setResumableSession(saved);
        setPhase("resumable");
      }
    } catch {
      window.localStorage.removeItem(EXAM_STORAGE_KEY);
      setPhase("config");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compte le pool disponible pour la mention sélectionnée (garde-fou "moins de 40 questions").
  useEffect(() => {
    if (phase !== "config") return;
    let active = true;
    (async () => {
      let query = supabase.from("civic_questions").select("id", { count: "exact", head: true });
      query = query.contains("mentions", [mention]);
      const { count } = await query;
      if (active) setExamPoolCount(count ?? null);
    })();
    return () => { active = false; };
  }, [mention, phase, supabase]);

  // Persiste la session en cours à chaque changement (réponses, navigation entre questions...).
  useEffect(() => {
    if (phase !== "exam" || !examEndAt || !examStartedAt) return;
    const payload: PersistedExamSession = { mention, questions, examAnswers, examEndAt, examStartedAt };
    window.localStorage.setItem(EXAM_STORAGE_KEY, JSON.stringify(payload));
  }, [phase, mention, questions, examAnswers, examEndAt, examStartedAt]);

  // Avertit avant de quitter/rafraîchir la page pendant un examen en cours.
  useEffect(() => {
    if (phase !== "exam") return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  const submitExam = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const qs = questionsRef.current;
    const ans = answersRef.current;
    if (qs.length === 0) return;
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
      await recordAttempt(supabase, mention, qs, ans, score, passed, duration);
    } catch (err) {
      console.error("Error submitting civic exam:", err);
      saveFailed = true;
    }
    window.localStorage.removeItem(EXAM_STORAGE_KEY);
    setExamResult({ score, passed, themeBreakdown, saveFailed });
    setPhase("finished");
  }, [examStartedAt, mention, supabase]);

  // Timer — soumission automatique à expiration.
  useEffect(() => {
    if (phase !== "exam" || !examEndAt) return;
    const tick = () => {
      const remaining = Math.max(0, Math.round((examEndAt - Date.now()) / 1000));
      setExamTimeLeft(remaining);
      if (remaining <= 0) submitExam();
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, examEndAt, submitExam]);

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
          if (filtered.length >= EXAM_QUESTION_COUNT) pool = filtered;
        }
      } else {
        const lastIds = getLastLocalAttemptForMention(mention)?.question_ids || [];
        if (lastIds.length > 0) {
          const filtered = pool.filter((q) => !lastIds.includes(q.id));
          if (filtered.length >= EXAM_QUESTION_COUNT) pool = filtered;
        }
      }

      const picked = pickStratifiedByTheme(pool, EXAM_QUESTION_COUNT).map((q) => ({ ...q, options: shuffle(q.options) }));
      const startedAt = Date.now();
      setQuestions(picked);
      setExamAnswers({});
      setIndex(0);
      setExamEndAt(startedAt + EXAM_DURATION_SECONDS * 1000);
      setExamTimeLeft(EXAM_DURATION_SECONDS);
      setExamStartedAt(startedAt);
      setExamResult(null);
      recordCivicSession();
      setPhase("exam");
    } catch (err) {
      console.error("Error starting civic exam:", err);
      setErrorMsg("Impossible de démarrer l'examen. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  }, [mention, supabase]);

  const resumeExam = () => {
    if (!resumableSession) return;
    setQuestions(resumableSession.questions);
    setExamAnswers(resumableSession.examAnswers);
    setIndex(0);
    setExamEndAt(resumableSession.examEndAt);
    setExamStartedAt(resumableSession.examStartedAt);
    setExamTimeLeft(Math.max(0, Math.round((resumableSession.examEndAt - Date.now()) / 1000)));
    setResumableSession(null);
    setPhase("exam");
  };

  const abandonResumableExam = () => {
    window.localStorage.removeItem(EXAM_STORAGE_KEY);
    setResumableSession(null);
    setPhase("config");
  };

  const handleAbandonExam = () => {
    if (!window.confirm("Abandonner l'examen en cours ? Votre progression ne sera pas enregistrée.")) return;
    if (timerRef.current) clearInterval(timerRef.current);
    window.localStorage.removeItem(EXAM_STORAGE_KEY);
    setQuestions([]);
    setExamAnswers({});
    setExamEndAt(null);
    setExamStartedAt(null);
    setPhase("config");
  };

  // Contrairement à "Abandonner", ne touche pas au localStorage : la session est déjà persistée
  // en continu (voir l'effect de persistance ci-dessus). Le minuteur repose sur une échéance
  // absolue (examEndAt) recalculée depuis l'horloge réelle à chaque chargement — refresh,
  // navigation ou fermeture de l'onglet ne le remettent jamais à zéro et ne l'arrêtent pas.
  const handleLeaveExam = () => {
    router.push("/examen-civique");
  };

  const handleReviewMistakes = () => {
    const wrongIds = questions
      .filter((q, i) => examAnswers[i] !== q.correct_answer)
      .map((q) => q.id);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(EXAM_MISTAKES_STORAGE_KEY, JSON.stringify(wrongIds));
    }
    router.push(`/examen-civique/entrainement?mention=${encodeURIComponent(mention)}&mode=erreurs`);
  };

  const handleReviewTheme = (themeVal: string) => {
    router.push(`/examen-civique/entrainement?mention=${encodeURIComponent(mention)}&theme=${encodeURIComponent(themeVal)}&mode=apprendre`);
  };

  // === CHARGEMENT / DÉTECTION DE SESSION ===
  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  // === SESSION INTERROMPUE DÉTECTÉE ===
  if (phase === "resumable" && resumableSession) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-6 p-8 rounded-[2rem] bg-amber-50 border-2 border-amber-200">
          <Clock className="mx-auto text-amber-600" size={36} />
          <div className="space-y-1">
            <p className="text-sm font-black text-amber-900">Examen blanc en cours — {mentionLabel(resumableSession.mention)}</p>
            <p className="text-xs text-amber-700 font-medium">
              Il reste {formatTime(Math.max(0, Math.round((resumableSession.examEndAt - Date.now()) / 1000)))} avant la fin du temps imparti.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={abandonResumableExam} className="flex-1 h-11 bg-white text-amber-700 font-black rounded-xl text-sm border border-amber-200">
              Abandonner
            </Button>
            <Button onClick={resumeExam} className="flex-1 h-11 bg-amber-600 text-white font-black rounded-xl text-sm">
              Reprendre
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // === CONFIGURATION (avant démarrage) ===
  if (phase === "config") {
    return (
      <div className="min-h-screen bg-zinc-50 p-6">
        <div className="max-w-xl mx-auto">
          <ExerciseLayout
            title={<>Passez un <span className="text-indigo-600">examen blanc</span></>}
            badge="Conditions réelles"
            description={`${EXAM_QUESTION_COUNT} questions officielles, 45 minutes chronométrées en continu. Vous pouvez quitter et revenir, mais le temps continue de s'écouler pendant votre absence. Seuil de réussite : ${EXAM_PASS_THRESHOLD}/${EXAM_QUESTION_COUNT}.`}
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Votre démarche</p>
                <div className="grid grid-cols-3 gap-2">
                  {MENTIONS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setMention(m.value)}
                      className={`py-3 px-2 rounded-2xl font-black text-xs transition-all leading-tight text-center ${mention === m.value ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white border border-zinc-100 text-zinc-500 hover:bg-zinc-50"}`}
                    >
                      <div>{m.label}</div>
                      {m.shortLabel && (
                        <div className={`text-[9px] font-bold normal-case mt-0.5 ${mention === m.value ? "text-indigo-200" : "text-zinc-400"}`}>({m.shortLabel})</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              {examPoolCount !== null && examPoolCount < EXAM_QUESTION_COUNT && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold text-left">
                  Seulement {examPoolCount} question{examPoolCount > 1 ? "s" : ""} disponible{examPoolCount > 1 ? "s" : ""} pour cette mention : l'examen en comptera {examPoolCount} au lieu de {EXAM_QUESTION_COUNT} (seuil ajusté à {passThresholdFor(examPoolCount)}/{examPoolCount}).
                </div>
              )}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">{errorMsg}</div>
              )}
              <div className="flex flex-col gap-3">
                <Button onClick={startExam} disabled={loading} className="h-12 bg-indigo-600 text-white rounded-2xl font-black text-sm">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <>C'est parti <ArrowRight className="ml-2" size={16} /></>}
                </Button>
                <Link href="/examen-civique">
                  <Button variant="secondary" className="w-full h-12 bg-zinc-100 text-zinc-600 rounded-2xl font-black text-sm">
                    Retour à l'accueil
                  </Button>
                </Link>
              </div>
            </div>
          </ExerciseLayout>
        </div>
      </div>
    );
  }

  // === RÉSULTATS ===
  if (phase === "finished" && examResult) {
    const wrongAnswers = questions
      .map((q, i) => ({ q, given: examAnswers[i] }))
      .filter(({ q, given }) => given !== q.correct_answer);

    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6">
        <div className="space-y-8 max-w-xl w-full">
          <div className="text-center space-y-4">
            <div className={`w-20 h-20 rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-2xl ${examResult.passed ? "bg-emerald-600 shadow-emerald-200" : "bg-rose-500 shadow-rose-200"}`}>
              <Trophy size={36} />
            </div>
            <h1 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">
              {examResult.passed ? "Examen réussi !" : "Pas encore, réessayez"}
            </h1>
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
                        <button onClick={() => handleReviewTheme(themeVal)} className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest">
                          Réviser →
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${pct}%` }} />
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
                  {examResult.passed ? "L'examen civique est fait. Et le TEF IRN ?" : "Préparez aussi votre niveau de français."}
                </p>
                <p className="text-xs text-indigo-200 font-medium leading-relaxed">
                  Votre démarche {mentionLabel(mention)} exige le niveau {MENTION_TO_LEVEL[mention] || "B1"} (TEF IRN).
                  Coach IA oral &amp; écrit, exercices adaptatifs — dès 55 €/mois.
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/tef-irn/login?from=examen_civique_result" className="flex-1">
                  <Button className="w-full h-11 bg-white text-indigo-700 rounded-2xl font-black text-sm hover:bg-indigo-50">
                    Essayer gratuitement <ArrowRight className="ml-2" size={15} />
                  </Button>
                </Link>
                <Link href="/tef-irn/pricing">
                  <Button variant="secondary" className="h-11 px-4 bg-indigo-500 border-none text-white rounded-2xl font-black text-sm hover:bg-indigo-400">
                    Tarifs
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {wrongAnswers.length > 0 && (
              <Button onClick={handleReviewMistakes} className="w-full h-12 bg-indigo-600 text-white rounded-2xl font-black text-sm">
                Réviser mes {wrongAnswers.length} erreur{wrongAnswers.length > 1 ? "s" : ""} <ArrowRight className="ml-2" size={16} />
              </Button>
            )}
            <Link href="/examen-civique">
              <Button variant={wrongAnswers.length > 0 ? "secondary" : undefined} className={`w-full h-12 rounded-2xl font-black text-sm ${wrongAnswers.length > 0 ? "bg-zinc-100 text-zinc-600" : "bg-zinc-900 text-white"}`}>
                Retour à l'accueil
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // === EXAMEN EN COURS ===
  const current = questions[index];
  const answeredCount = Object.keys(examAnswers).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <header className="bg-white border-b border-zinc-100 px-6 py-3 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Badge className="bg-indigo-600 text-white rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest">
            Examen blanc • {mentionLabel(mention)}
          </Badge>
          <div className={`flex items-center gap-2 font-black text-sm ${examTimeLeft < 300 ? "text-rose-600" : "text-zinc-900"}`}>
            <Clock size={16} /> {formatTime(examTimeLeft)}
          </div>
        </div>
        <div className="max-w-4xl mx-auto mt-2.5 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={handleLeaveExam}
              className="h-8 px-3 rounded-lg bg-zinc-100 text-zinc-600 text-[11px] font-black flex items-center gap-1.5 hover:bg-zinc-200 transition-colors"
            >
              <LogOut size={13} /> Continuer plus tard
            </button>
            <button
              onClick={handleAbandonExam}
              className="h-8 px-3 rounded-lg bg-rose-50 text-rose-600 text-[11px] font-black flex items-center gap-1.5 hover:bg-rose-100 transition-colors"
            >
              <XCircle size={13} /> Abandonner
            </button>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{answeredCount}/{questions.length} répondues</span>
        </div>
        <div className="max-w-4xl mx-auto mt-2">
          <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%` }} />
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
                i === index ? "bg-zinc-900 text-white ring-2 ring-zinc-900 ring-offset-1" : examAnswers[i] ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
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
                className={`w-full p-4 rounded-2xl border-2 text-left font-bold text-sm transition-all ${examAnswers[index] === opt ? "border-indigo-600 bg-indigo-50 text-indigo-900" : "border-zinc-100 bg-white text-zinc-600 hover:border-zinc-300"}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </Card>

        <div className="flex items-center justify-between gap-4">
          <Button variant="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)} className="h-12 bg-zinc-100 text-zinc-600 font-black rounded-2xl text-sm">
            Précédent
          </Button>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{answeredCount} / {questions.length} répondues</p>
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
                ? `Il vous reste ${unansweredCount} question${unansweredCount > 1 ? "s" : ""} sans réponse. Elles seront comptées comme incorrectes. Voulez-vous vraiment terminer ?`
                : "Vous avez répondu à toutes les questions. Voir votre score ?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmSubmitOpen(false)} className="rounded-2xl font-black text-sm">
              Continuer l'examen
            </Button>
            <Button onClick={() => { setConfirmSubmitOpen(false); submitExam(); }} className="bg-emerald-600 text-white rounded-2xl font-black text-sm">
              Terminer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function CivicExam() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-zinc-50"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>}>
      <CivicExamContent />
    </Suspense>
  );
}
