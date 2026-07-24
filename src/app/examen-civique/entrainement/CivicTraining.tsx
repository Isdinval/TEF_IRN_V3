"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import { useCivicContext, DEFAULT_THEME } from "@/components/features/examen-civique/useCivicContext";
import { useShowCivicTefBridge } from "@/components/features/examen-civique/useShowCivicTefBridge";
import { THEMES, mentionLabel, EXAM_MISTAKES_STORAGE_KEY } from "@/lib/civic-constants";
import { updateCivicSRS } from "@/lib/civic-srs-engine";
import { getLocalDueQuestionIds, updateLocalCivicSRS, recordCivicSession } from "@/lib/civic-local-store";
import { ExerciseLayout } from "@/components/shared/ExerciseLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy, ArrowRight, CheckCircle2, XCircle } from "lucide-react";

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

type TrainingStep = "learn" | "quiz";
type TrainingMode = "apprendre" | "memoriser" | "erreurs";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => 0.5 - Math.random());
}

function CivicTrainingContent() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mention, theme } = useCivicContext();

  const showCTATef = useShowCivicTefBridge();
  const [dueCount, setDueCount] = useState<number | null>(null);
  const [activeMode, setActiveMode] = useState<TrainingMode>("apprendre");

  const [questions, setQuestions] = useState<CivicQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<TrainingStep>("learn");
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasDue = (dueCount ?? 0) > 0;

  const fetchDueCount = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setDueCount(getLocalDueQuestionIds(200).length); return; }
    const { count } = await supabase
      .from("user_civic_reviews")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .lte("next_review_at", new Date().toISOString());
    setDueCount(count || 0);
  }, [supabase]);

  useEffect(() => { fetchDueCount(); }, [fetchDueCount]);

  const startTraining = useCallback(async (review: boolean) => {
    setLoading(true);
    setErrorMsg(null);
    setActiveMode(review ? "memoriser" : "apprendre");
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
            .in("id", reviews.map((r: { question_id: string }) => r.question_id));
          if (data && data.length > 0) {
            setQuestions(shuffle(data as CivicQuestion[]));
            recordCivicSession();
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
            recordCivicSession();
            setIndex(0); setStep("learn"); setFinished(false); setSessionCorrect(0);
            setLoading(false);
            return;
          }
        }
      }

      let query = supabase.from("civic_questions").select("*");
      query = query.contains("mentions", [mention]);
      if (theme !== DEFAULT_THEME) query = query.eq("theme", theme);
      const { data, error } = await query.limit(15);
      if (error) throw error;

      if (data && data.length > 0) {
        setQuestions(shuffle(data as CivicQuestion[]));
        recordCivicSession();
        setIndex(0); setStep("learn"); setFinished(false); setSessionCorrect(0);
      } else if (review) {
        setErrorMsg("Aucune révision prévue pour l'instant. Revenez après une session Apprendre.");
      } else {
        setErrorMsg("Aucune question ne correspond à ces filtres. Essayez une autre démarche ou thématique.");
      }
    } catch (err) {
      console.error("Error starting civic training:", err);
      setErrorMsg("Impossible de charger les questions. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  }, [mention, theme, supabase]);

  // Révision ponctuelle des questions ratées à un examen blanc (voir handleReviewMistakes dans
  // CivicExam.tsx) : les IDs transitent par sessionStorage, lus puis effacés ici (usage unique).
  const startFromMistakes = useCallback(async (ids: string[]) => {
    setLoading(true);
    setErrorMsg(null);
    setActiveMode("erreurs");
    try {
      const { data, error } = await supabase.from("civic_questions").select("*").in("id", ids);
      if (error) throw error;
      if (data && data.length > 0) {
        setQuestions(shuffle(data as CivicQuestion[]));
        setIndex(0); setStep("learn"); setFinished(false); setSessionCorrect(0);
      } else {
        setErrorMsg("Impossible de retrouver ces questions. Réessayez depuis l'examen.");
      }
    } catch (err) {
      console.error("Error loading civic exam mistakes:", err);
      setErrorMsg("Impossible de charger vos erreurs. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Lance automatiquement la session au chargement, selon ?mode=apprendre|memoriser|erreurs
  // (posé par le sommaire ou l'examen blanc — défaut : apprendre).
  useEffect(() => {
    const requested = searchParams.get("mode");
    if (requested === "erreurs" && typeof window !== "undefined") {
      const raw = window.sessionStorage.getItem(EXAM_MISTAKES_STORAGE_KEY);
      window.sessionStorage.removeItem(EXAM_MISTAKES_STORAGE_KEY);
      const ids: string[] = raw ? JSON.parse(raw) : [];
      if (ids.length > 0) { startFromMistakes(ids); return; }
      // Lien direct sans contexte d'examen (raw absent) : repli sur Apprendre.
    }
    startTraining(requested === "memoriser");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchMode = (nextMode: "apprendre" | "memoriser") => {
    if (nextMode === activeMode && questions.length > 0) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", nextMode);
    router.replace(`/examen-civique/entrainement?${params.toString()}`, { scroll: false });
    startTraining(nextMode === "memoriser");
  };

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
      // "Je connais déjà" est traité comme une bonne réponse : planifie la question à plus long
      // terme plutôt que de la laisser réapparaître indéfiniment dans le pool des nouvelles questions.
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

  // === CHARGEMENT INITIAL ===
  if (loading && questions.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  // === ERREUR (ex. aucune question pour ces filtres) ===
  if (errorMsg && questions.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center gap-4">
        <p className="text-sm text-zinc-500 font-bold max-w-sm">{errorMsg}</p>
        <div className="flex gap-2">
          {hasDue && activeMode !== "memoriser" && (
            <Button onClick={() => switchMode("memoriser")} className="h-11 bg-indigo-600 text-white rounded-2xl font-black text-sm">
              Mémoriser à la place
            </Button>
          )}
          <Link href="/examen-civique">
            <Button variant="secondary" className="h-11 bg-zinc-100 text-zinc-600 rounded-2xl font-black text-sm">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // === FIN DE SESSION ===
  if (finished) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8 max-w-md w-full">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
            <Trophy size={36} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Session terminée !</h1>
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
            {/* Priorité 1 : des révisions sont maintenant dues (ex. après une session Apprendre) */}
            {hasDue && activeMode !== "memoriser" ? (
              <Button onClick={() => switchMode("memoriser")} className="h-12 bg-indigo-600 text-white rounded-2xl font-black text-sm">
                Mémoriser — {dueCount} révision{dueCount! > 1 ? "s" : ""} prévue{dueCount! > 1 ? "s" : ""} <ArrowRight className="ml-2" size={16} />
              </Button>
            ) : !hasDue && sessionCorrect / questions.length >= 0.8 ? (
              <Link href="/examen-civique/examen-blanc">
                <Button className="w-full h-12 bg-emerald-600 text-white rounded-2xl font-black text-sm">
                  Tester avec un examen blanc <ArrowRight className="ml-2" size={16} />
                </Button>
              </Link>
            ) : !hasDue ? (
              <Button onClick={() => switchMode("apprendre")} className="h-12 bg-indigo-600 text-white rounded-2xl font-black text-sm">
                Continuer à apprendre <ArrowRight className="ml-2" size={16} />
              </Button>
            ) : null}
            <Link href="/examen-civique">
              <Button variant="secondary" className="w-full h-12 bg-zinc-100 text-zinc-600 rounded-2xl font-black text-sm">
                Retour à l'accueil
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // === SESSION EN COURS (learn -> quiz) ===
  const current = questions[index];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <ExerciseLayout
        variant="compact"
        title={activeMode === "memoriser" ? "Mémoriser" : activeMode === "erreurs" ? "Révision de vos erreurs" : "Apprendre"}
        badge={mentionLabel(mention)}
        badgeColor="indigo"
        onBack={() => router.push("/examen-civique")}
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
            <motion.div key="learn" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="w-full max-w-xl space-y-6">
              <Card className="p-8 rounded-[2.5rem] border-none shadow-2xl shadow-zinc-200 bg-white space-y-4">
                <Badge className="bg-indigo-50 text-indigo-600 border-none rounded-full px-3 py-1 text-[10px] font-black uppercase">
                  {THEMES.find((t) => t.value === current?.theme)?.label || current?.theme}
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
                <Button onClick={handleSkip} variant="secondary" className="h-12 flex-1 bg-zinc-100 text-zinc-600 font-black rounded-2xl text-sm hover:bg-zinc-200">
                  Passer
                </Button>
                <Button onClick={handleReadyForQuiz} className="h-12 flex-[2] bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 text-sm">
                  Je suis prêt(e), tester ma mémoire <ArrowRight className="ml-2" size={16} />
                </Button>
              </div>
            </motion.div>
          )}

          {step === "quiz" && (
            <motion.div key="quiz" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-xl space-y-6">
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
                      selectedOption === opt ? "border-indigo-600 bg-indigo-50 text-indigo-900" : "border-zinc-100 bg-white text-zinc-600 hover:border-zinc-300"
                    } ${checked && opt === current?.correct_answer ? "border-emerald-500 bg-emerald-50 text-emerald-900" : ""}
                      ${checked && selectedOption === opt && opt !== current?.correct_answer ? "border-rose-500 bg-rose-50 text-rose-900" : ""}`}
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
                  <div className={`flex items-center gap-2 justify-center p-3 rounded-xl font-bold text-sm ${selectedOption === current?.correct_answer ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
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

export function CivicTraining() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-zinc-50"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>}>
      <CivicTrainingContent />
    </Suspense>
  );
}
