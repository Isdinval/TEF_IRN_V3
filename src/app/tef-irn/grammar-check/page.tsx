"use client";

import { useState, useEffect, Suspense, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import GrammarCheckTreeCatalogue, { LessonMeta } from "./components/GrammarCheckTreeCatalogue";
import { Exercise } from "@/lib/parcours";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Target, Sparkles, Zap, GraduationCap, ArrowRight, RotateCcw, BookOpen, ChevronUp, Search, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LessonMarkdown from "@/components/shared/LessonMarkdown";
import { useParcours } from "@/contexts/ParcoursContext";
import { ExerciseLayout } from "@/components/shared/ExerciseLayout";
import { ExerciseContextHeader } from "@/components/shared/ExerciseContextHeader";
import { useExerciseFilters } from "@/hooks/useExerciseFilters";
import { splitTitle } from "@/lib/lessons";
import { cn } from "@/lib/utils";
import { LlamaMountainDecoration } from "@/components/decorative/LlamaMountainDecoration";
import { DestinationLandmarkDecoration } from "@/components/decorative/DestinationLandmarkDecoration";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useResizableSplit } from "@/hooks/useResizableSplit";
import { resolveNextExercises } from "@/lib/recommendation-resolver";
import {
  VICTORY_MASCOT_URLS,
  PERPLEXED_MASCOT_URLS,
  pickRandomImage,
} from "@/data/grammar-check-images";

interface GrammarQuestion {
  difficulty?: string;
  tags?: string[];
  is_ai_generated?: boolean;
  id: string;
  /**
   * Phrase brute. Si elle contient une erreur, le mot fautif est encadré
   * par des crochets, ex: "Elles sont [parti] en vacances."
   * Si la phrase est correcte, aucun crochet n'est présent.
   */
  sentence: string;
  /** Mot correct à afficher après validation (uniquement si la phrase contient une erreur) */
  correct_word: string;
  explanation: string;
  category: string;
  level: string;
  instructions?: string;
  lesson_id?: string;
  point_cles_lesson?: string;
}

/** Un token de la phrase, avec l'info "est-ce le mot fautif ?" */
interface SentenceToken {
  index: number;
  display: string;
  isErrorWord: boolean;
}

/**
 * Parse une phrase au format Voltaire (notation [mot]).
 * - Sépare la phrase en tokens (mots) sur les espaces.
 * - Détecte le token entouré de crochets -> c'est le mot fautif.
 * - Conserve la ponctuation collée en dehors des crochets (ex: "[parti].").
 */
function parseVoltaireSentence(sentence: string): {
  tokens: SentenceToken[];
  hasError: boolean;
  errorIndex: number | null;
} {
  const rawTokens = (sentence || "").split(/\s+/).filter(Boolean);
  let hasError = false;
  let errorIndex: number | null = null;

  const tokens: SentenceToken[] = rawTokens.map((raw, index) => {
    const match = raw.match(/^([^[\]]*)\[([^[\]]+)\]([^[\]]*)$/);
    if (match) {
      hasError = true;
      errorIndex = index;
      const [, prefix, word, suffix] = match;
      return { index, display: `${prefix}${word}${suffix}`, isErrorWord: true };
    }
    return { index, display: raw, isErrorWord: false };
  });

  return { tokens, hasError, errorIndex };
}

interface LessonSummary {
  title: string;
  content: string;
  slug?: string;
}

// Mélange l'ordre des questions d'un exercice Voltaire (Fisher-Yates), même
// pattern que shuffleOptions() dans practice/page.tsx. Sans ça, la phrase sans
// faute a tendance à se retrouver toujours à la même position dans le contenu
// généré (souvent en 2e position sur les exercices à 5 questions), ce qui
// laisse l'utilisateur deviner par pattern de position plutôt que par lecture
// grammaticale réelle. Chaque élément de `questions` porte déjà sa propre
// sentence/correct_word/explanation (assemblés par index dans startTraining),
// donc mélanger le tableau final suffit -- pas besoin de remapper des index.
function shuffleQuestions<T>(questions: T[]): T[] {
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function GrammarCheckContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const exerciseIdFromParams = (params?.id as string) || searchParams.get("id");
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(exerciseIdFromParams);

  const supabase = useMemo(() => createClient(), []);
  const { nextLesson } = useParcours();
  const { filters, setLevel, setCategory } = useExerciseFilters("A2", "Grammaire");

  const [mode, setMode] = useState<"selection" | "training" | "result">("selection");
  const [questions, setQuestions] = useState<GrammarQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [selectedNoError, setSelectedNoError] = useState(false);
  const [status, setStatus] = useState<"typing" | "correct" | "wrong">("typing");
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [catalogue, setCatalogue] = useState<Exercise[]>([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);
  const [catalogueError, setCatalogueError] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [hideCompleted, setHideCompleted] = useState(false);
  const [sortOrder, setSortOrder] = useState<"recent" | "ancien">("recent");
  // Titre + order_index de chaque leçon référencée par le catalogue courant, utilisés
  // par GrammarCheckTreeCatalogue pour titrer et trier le niveau 1 de l'arbre.
  const [lessonMeta, setLessonMeta] = useState<Record<string, LessonMeta>>({});
  const [lessonVisible, setLessonVisible] = useState(false);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [lessonCache, setLessonCache] = useState<Record<string, LessonSummary>>({});
  // Titre + slug de leçon (sans le contenu), pour le fil d'Ariane cliquable du
  // bandeau de contexte — toujours visible sans clic, indépendant du panneau
  // complet "Voir la leçon" (lessonCache) qui charge aussi le content markdown.
  const [lessonBreadcrumbById, setLessonBreadcrumbById] = useState<Record<string, { title: string; slug: string }>>({});
  // Slug de chaque parcours (level+category), pour le 1er maillon cliquable du
  // fil d'Ariane. Liste courte (~20 parcours) : un seul fetch, mis en cache.
  const [parcoursSlugs, setParcoursSlugs] = useState<{ slug: string; level: string; category: string }[] | null>(null);
  // Défaut = 1ère pose (identique SSR/CSR), tirage aléatoire déclenché ensuite
  // uniquement via des événements 100% client (cf. handleNextAction / fetchCatalogue)
  // pour éviter tout mismatch d'hydratation Next.js.
  const [resultMascotUrl, setResultMascotUrl] = useState<string>(VICTORY_MASCOT_URLS[0]);
  const [emptyStateMascotUrl, setEmptyStateMascotUrl] = useState<string>(PERPLEXED_MASCOT_URLS[0]);
  const [recommendedExerciseId, setRecommendedExerciseId] = useState<string | null>(null);
  const [recommendationReason, setRecommendationReason] = useState<string | null>(null);

  const hasInitialized = useRef(false);
  const isFetchingCatalogue = useRef(false);
  const sessionStartRef = useRef<number | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { leftPct, containerRef: splitContainerRef, onDragStart } = useResizableSplit(50);

  // Debounce de la recherche texte (300ms) pour éviter une requête par frappe.
  useEffect(() => {
    const timeout = setTimeout(() => setSearchQuery(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const fetchCatalogue = useCallback(async () => {
    if (isFetchingCatalogue.current) return;
    isFetchingCatalogue.current = true;
    setLoadingCatalogue(true);
    setCatalogueError(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let excludeIds: string[] = [];
      if (user && hideCompleted) {
        const { data: completed } = await supabase
          .from("exercise_attempts")
          .select("exercise_id")
          .eq("user_id", user.id)
          .eq("is_completed", true);
        excludeIds = Array.from(new Set((completed || []).map((c: any) => c.exercise_id).filter(Boolean)));
      }

      let query = supabase
        .from("exercises")
        .select("*")
        .eq("type", "trous")
        .eq("level", filters.level);
      if (filters.category !== "Toutes") query = query.ilike("category", `%${filters.category}%`);
      if (searchQuery) query = query.ilike("instructions", `%${searchQuery}%`);
      if (excludeIds.length > 0) query = query.not("id", "in", `(${excludeIds.join(",")})`);

      // Pas de pagination : tout le catalogue filtré est chargé en une fois puis
      // organisé en arbre (leçon > point clé) par GrammarCheckTreeCatalogue, replié
      // par défaut. Vérifié en base : pire cas actuel ~220 exercices / 22 leçons
      // (B1 Grammaire), même ordre de grandeur que l'accordéon vocab par catégorie.
      const { data: exercises } = await query
        .order("created_at", { ascending: sortOrder === "ancien" });

      if (exercises && exercises.length > 0) {
        const lessonIds = Array.from(new Set(exercises.map((e: any) => e.lesson_id).filter(Boolean)));
        if (lessonIds.length > 0) {
          const { data: lessons } = await supabase.from("lessons").select("id, title, order_index").in("id", lessonIds);
          const metaMap: Record<string, LessonMeta> = {};
          (lessons || []).forEach((l: any) => {
            metaMap[l.id] = { title: l.title || "", order_index: l.order_index ?? 0 };
          });
          setLessonMeta(metaMap);
        } else {
          setLessonMeta({});
        }
      } else {
        setLessonMeta({});
      }

      if (exercises && user) {
        const { data: attempts } = await supabase
          .from("exercise_attempts")
          .select("exercise_id, is_completed, score")
          .eq("user_id", user.id)
          .in("exercise_id", exercises.map((e: any) => e.id));

        const mapped = exercises.map((ex: any) => {
          const exAttempts = attempts?.filter((a: any) => a.exercise_id === ex.id) || [];
          return {
            ...ex,
            point_cles_lesson: ex["point_clés_lesson"],
            is_completed: exAttempts.some((a: any) => a.is_completed),
            attempts_count: exAttempts.length,
            success_rate: exAttempts.length > 0 ? Math.max(...exAttempts.map((a: any) => a.score || 0)) : undefined
          };
        });
        setCatalogue(mapped);
        if (mapped.length === 0) setEmptyStateMascotUrl(pickRandomImage(PERPLEXED_MASCOT_URLS));
      } else {
        const mapped = (exercises || []).map((ex: any) => ({ ...ex, point_cles_lesson: ex["point_clés_lesson"] }));
        setCatalogue(mapped);
        if (mapped.length === 0) setEmptyStateMascotUrl(pickRandomImage(PERPLEXED_MASCOT_URLS));
      }
    } catch (err) {
      console.error("Error fetching catalogue:", err);
      setCatalogueError(true);
    } finally {
      setLoadingCatalogue(false);
      isFetchingCatalogue.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.level, filters.category, searchQuery, hideCompleted, sortOrder, supabase]);

  const fetchRecommendation = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setRecommendedExerciseId(null);
      setRecommendationReason(null);
      return;
    }
    try {
      const [recommended] = await resolveNextExercises(
        user.id,
        {
          level: filters.level,
          category: filters.category !== "Toutes" ? filters.category : undefined,
          type: "trous",
        },
        supabase,
        1
      );
      setRecommendedExerciseId(recommended?.id ?? null);
      setRecommendationReason((recommended as any)?.recommendation_reason ?? null);
    } catch (err) {
      console.error("Error fetching recommendation:", err);
    }
  }, [filters.level, filters.category, supabase]);

  useEffect(() => {
    if (mode === "selection" && !exerciseIdFromParams) {
      fetchRecommendation();
    }
  }, [fetchRecommendation, mode, exerciseIdFromParams]);

  useEffect(() => {
    if (mode === "selection" && !exerciseIdFromParams) {
      fetchCatalogue();
    }
  }, [fetchCatalogue, mode, exerciseIdFromParams]);

  useEffect(() => {
    if (mode === "training") {
      sessionStartRef.current = Date.now();
    }
  }, [mode]);

  const startTraining = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Exercise not found");

      let qs: GrammarQuestion[] = [];
      if (data.content?.questions && Array.isArray(data.content.questions)) {
          qs = data.content.questions.map((q: string, i: number) => ({
              id: `${data.id}-${i}`,
              sentence: q,
              correct_word: String(
                data.content.correct_words?.[i] ?? data.content.corrections?.[i] ?? data.content.correct_answers?.[i] ?? ""
              ),
              explanation: data.content.explanations?.[i] || "",
              category: data.category,
              level: data.level,
              difficulty: data.difficulty,
              instructions: data.instructions,
              lesson_id: data.lesson_id,
              point_cles_lesson: data["point_clés_lesson"]
          }));
      } else if (data.content?.sentence) {
          qs = [{
              id: data.id,
              sentence: data.content.sentence,
              correct_word: String(
                data.content.correct_word ?? data.content.correction ?? data.content.correct_answer ?? ""
              ),
              explanation: data.content.explanation || "",
              category: data.category,
              level: data.level,
              difficulty: data.difficulty,
              instructions: data.instructions,
              lesson_id: data.lesson_id,
              point_cles_lesson: data["point_clés_lesson"]
          }];
      }

      if (qs.length > 0) {
          // Uniquement pertinent pour le format multi-questions (content.questions[]) --
          // le format legacy à une seule sentence (content.sentence) n'a rien à mélanger.
          const orderedQs = qs.length > 1 ? shuffleQuestions(qs) : qs;
          setActiveExerciseId(data.id);
          setQuestions(orderedQs);
          setMode("training");
          setCurrentIdx(0);
          setScore(0);
          setSelectedWordIndex(null);
          setSelectedNoError(false);
          setStatus("typing");
          setLessonVisible(false);
      } else {
          setMode("selection");
      }
    } catch (err) {
      console.error("Error starting training:", err);
      setMode("selection");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (hasInitialized.current) return;
    if (exerciseIdFromParams && mode === "selection" && !loading) {
      hasInitialized.current = true;
      startTraining(exerciseIdFromParams);
    }
  }, [exerciseIdFromParams, startTraining, mode, loading]);

  const current = questions[currentIdx];
  const currentParsed = useMemo(
    () => parseVoltaireSentence(current?.sentence || ""),
    [current]
  );

  const handleSelectWord = (index: number) => {
    if (status !== "typing") return;
    setSelectedWordIndex(index);
    setSelectedNoError(false);
  };

  const handleSelectNoError = () => {
    if (status !== "typing") return;
    setSelectedNoError(true);
    setSelectedWordIndex(null);
  };

  const checkCorrection = () => {
    if (!current) return;
    const { hasError, errorIndex } = currentParsed;
    const isCorrect = hasError
      ? selectedWordIndex === errorIndex
      : selectedNoError;
    if (isCorrect) {
      setStatus("correct");
      setScore(s => s + 1);
    } else {
      setStatus("wrong");
    }
  };

  const handleNextAction = async () => {
        if (currentIdx < questions.length - 1) {
          setCurrentIdx(c => c + 1);
          setSelectedWordIndex(null);
          setSelectedNoError(false);
          setStatus("typing");
          setLessonVisible(false);
        } else {
          setMode("result");
          setResultMascotUrl(pickRandomImage(VICTORY_MASCOT_URLS));
          const finalScore = Math.round((score / questions.length) * 100);
          const studyTimeMinutes = sessionStartRef.current
            ? Math.round((Date.now() - sessionStartRef.current) / 60000)
            : 0;
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && activeExerciseId) {
              await fetch('/api/exercise-complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  exerciseId: activeExerciseId,
                  score: finalScore,
                  answers: { correct: score, total: questions.length },
                  studyTimeMinutes
                })
              });
            }
          } catch (err) {
            console.error("Error saving attempt:", err);
          }
        }
      };

  const toggleLesson = useCallback(async (lessonId?: string) => {
    if (!lessonId) return;
    if (lessonVisible) {
      setLessonVisible(false);
      return;
    }
    if (!lessonCache[lessonId]) {
      setLoadingLesson(true);
      try {
        const { data, error } = await supabase
          .from("lessons")
          .select("title, content, slug")
          .eq("id", lessonId)
          .single();
        if (error) throw error;
        if (data) {
          setLessonCache(prev => ({ ...prev, [lessonId]: data as LessonSummary }));
          setLessonBreadcrumbById(prev => ({ ...prev, [lessonId]: { title: splitTitle(data.title || "").main, slug: data.slug as string } }));
        }
      } catch (err) {
        console.error("Error fetching lesson:", err);
      } finally {
        setLoadingLesson(false);
      }
    }
    setLessonVisible(true);
  }, [lessonVisible, lessonCache, supabase]);

  // Fetch léger (title + slug, sans le content) du fil d'Ariane pédagogique, dès
  // qu'un exercice avec lesson_id est affiché — indépendant du clic "Voir la
  // leçon" (toggleLesson ci-dessus, qui charge en plus le content markdown).
  useEffect(() => {
    const lessonId = questions[currentIdx]?.lesson_id;
    if (!lessonId || lessonBreadcrumbById[lessonId]) return;
    let active = true;
    (async () => {
      const { data } = await supabase.from("lessons").select("title, slug").eq("id", lessonId).single();
      if (active && data?.title) {
        setLessonBreadcrumbById(prev => ({ ...prev, [lessonId]: { title: splitTitle(data.title).main, slug: data.slug } }));
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, currentIdx, supabase]);

  // Slugs de parcours (level+category -> slug), pour le lien "Grammaire A2" du
  // fil d'Ariane — chargés une seule fois, liste courte (~20 parcours).
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from("parcours").select("slug, level, category");
      if (active) setParcoursSlugs(data || []);
    })();
    return () => { active = false; };
  }, [supabase]);

  const getParcoursSlug = useCallback((level?: string, category?: string) => {
    if (!level || !category || !parcoursSlugs) return undefined;
    return parcoursSlugs.find(
      (p) => p.level === level && p.category.toLowerCase() === category.toLowerCase()
    )?.slug;
  }, [parcoursSlugs]);

  const handleBack = () => {
    if (mode === "selection") {
      router.back();
    } else {
      setMode("selection");
      if (params?.id) {
          router.push("/tef-irn/grammar-check");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
          <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">Chargement de l'exercice...</p>
        </div>
      </div>
    );
  }

  if (mode === "result") {
    const finalPercent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8 max-w-md w-full">
          <img
            src={resultMascotUrl}
            alt="Mascotte LlamaKusi célébrant la réussite de l'exercice"
            className="w-28 h-28 mx-auto object-contain drop-shadow-xl"
          />
          <div className="space-y-2">
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Entraînement terminé !</h2>
            <p className="text-sm text-zinc-500 font-medium">Excellent travail de repérage et correction.</p>
            {(questions[0]?.level || questions[0]?.category) && (
              <div className="flex items-center justify-center gap-2 pt-1">
                {questions[0]?.level && (
                  <Badge className="bg-indigo-600 text-white rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest border-none">
                    {questions[0].level}
                  </Badge>
                )}
                {questions[0]?.category && (
                  <Badge variant="outline" className="rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest">
                    {questions[0].category}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-zinc-100 flex items-center justify-around">
            <div className="text-center">
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Score</div>
              <div className="text-2xl font-black text-zinc-900">{finalPercent}%</div>
            </div>
            <div className="w-px h-10 bg-zinc-100" />
            <div className="text-center">
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Réponses</div>
              <div className="text-2xl font-black text-emerald-600">{score} / {questions.length}</div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                setMode("selection");
                if (params?.id) {
                  router.push("/tef-irn/grammar-check");
                }
              }}
              className="h-12 bg-zinc-900 text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-black transition-all"
            >Retourner au catalogue</Button>
            {nextLesson && (
              <Button onClick={() => nextLesson()} variant="outline" className="h-12 border-2 border-zinc-100 rounded-2xl font-bold text-sm text-zinc-600 hover:bg-zinc-50 transition-all">Leçon suivante</Button>
            )}
            <Button
                variant="ghost"
                onClick={() => {
                    if (exerciseIdFromParams) startTraining(exerciseIdFromParams);
                }}
                className="h-12 text-zinc-400 font-black uppercase tracking-widest text-[10px] hover:text-zinc-900"
              >
                <RotateCcw size={14} className="mr-2" /> Recommencer l'exercice
              </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (mode === "training") {
    const totalQuestions = questions.length;
    const progress = totalQuestions > 0 ? ((currentIdx + 1) / totalQuestions) * 100 : 0;
    const activeLesson = current?.lesson_id ? lessonCache[current.lesson_id] : undefined;
    const showLessonPanel = lessonVisible && !!activeLesson;
    const showSplit = showLessonPanel && isDesktop;
    const lessonPanelContent = activeLesson ? (
      <>
        <div className="flex items-center gap-2 mb-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
          <BookOpen size={14} /> Leçon associée
        </div>
        {(() => {
          const { main, subtitle } = splitTitle(activeLesson.title || "");
          return (
            <div className="mb-3">
              <h4 className="text-base font-black text-zinc-900 leading-snug">{main}</h4>
              {subtitle && <p className="text-xs font-medium text-zinc-400 mt-0.5">{subtitle}</p>}
            </div>
          );
        })()}
        <LessonMarkdown content={activeLesson.content} />
      </>
    ) : null;

    return (
      <div className={cn("relative h-full bg-zinc-50 flex flex-col", showSplit && "md:overflow-hidden")}>
        <LlamaMountainDecoration variant="grammar" />
        <DestinationLandmarkDecoration variant="grammar" />
        <ExerciseLayout
          variant="compact"
          title="CHASSE AUX ERREURS"
          badge="Coach Repérage d'Erreurs"
          badgeColor="indigo"
          onBack={handleBack}
          rightElement={
            <div className="hidden md:flex items-center gap-6">
              {current?.lesson_id && (
                <Button
                  onClick={() => toggleLesson(current.lesson_id)}
                  variant="outline"
                  className="h-10 rounded-xl border-2 border-indigo-100 bg-indigo-50 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100"
                >
                  {loadingLesson ? (
                    <Loader2 size={14} className="mr-2 animate-spin" />
                  ) : lessonVisible ? (
                    <ChevronUp size={14} className="mr-2" />
                  ) : (
                    <BookOpen size={14} className="mr-2" />
                  )}
                  {lessonVisible ? "Masquer la leçon" : "Voir la leçon"}
                </Button>
              )}
              <div className="text-right">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Score</div>
                <div className="text-2xl font-black text-zinc-900">{score} / {totalQuestions}</div>
              </div>
              <div className="h-12 w-px bg-zinc-100" />
              <div className="flex flex-col gap-2">
                 <div className="w-48 h-3 bg-zinc-100 rounded-full overflow-hidden border border-zinc-50 shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-indigo-600"
                    />
                 </div>
                 <div className="flex justify-between text-[8px] font-black text-zinc-300 uppercase tracking-widest">
                    <span>DÉBUT</span>
                    <span>{Math.round(progress)}%</span>
                    <span>FIN</span>
                 </div>
              </div>
            </div>
          }
        />

        <main
          ref={splitContainerRef}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-4 p-3 lg:p-4 overflow-y-auto",
            showSplit && "md:flex-row md:items-stretch md:gap-0 md:overflow-hidden md:min-h-0"
          )}
        >
          <div
            className={cn(
              "w-full",
              showSplit && "md:h-full md:overflow-y-auto md:shrink-0 md:flex md:flex-col md:items-center md:justify-center"
            )}
            style={showSplit ? { width: `${leftPct}%` } : undefined}
          >
            <div className="max-w-2xl w-full mx-auto md:px-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIdx}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  className="space-y-3"
                >
                  <ExerciseContextHeader
                    category={current?.category}
                    level={current?.level}
                    difficulty={current?.difficulty}
                    instructions={current?.instructions}
                    pointCle={current?.point_cles_lesson}
                    parcoursLabel={current ? `${current.category} ${current.level}` : undefined}
                    parcoursHref={(() => {
                      const slug = getParcoursSlug(current?.level, current?.category);
                      return slug ? `/tef-irn/parcours/${slug}` : undefined;
                    })()}
                    lessonTitle={current?.lesson_id ? lessonBreadcrumbById[current.lesson_id]?.title : undefined}
                    lessonHref={
                      current?.lesson_id && lessonBreadcrumbById[current.lesson_id]?.slug
                        ? `/tef-irn/lessons/${lessonBreadcrumbById[current.lesson_id].slug}`
                        : undefined
                    }
                  accentColor="indigo"
                />

                <div className="bg-white p-4 lg:p-6 rounded-[2rem] shadow-xl shadow-zinc-200/30 text-center relative overflow-hidden border-4 border-white ring-1 ring-zinc-100">
                  <div className="flex flex-wrap items-center justify-center gap-2 relative z-10">
                    {currentParsed.tokens.map((token) => {
                      const isSelected = selectedWordIndex === token.index;
                      const isTheError = currentParsed.hasError && token.index === currentParsed.errorIndex;

                      let stateClass = "bg-zinc-50 text-zinc-900 border-transparent hover:bg-indigo-50 hover:border-indigo-100";
                      if (status === "typing") {
                        if (isSelected) {
                          stateClass = "bg-indigo-600 text-white border-indigo-600";
                        }
                      } else {
                        if (isTheError && isSelected) {
                          stateClass = "bg-emerald-500 text-white border-emerald-600";
                        } else if (isTheError) {
                          stateClass = "bg-emerald-100 text-emerald-900 border-emerald-400";
                        } else if (isSelected) {
                          stateClass = "bg-rose-100 text-rose-900 border-rose-400";
                        } else {
                          stateClass = "bg-zinc-50 text-zinc-400 border-transparent";
                        }
                      }

                      return (
                        <button
                          key={token.index}
                          type="button"
                          onClick={() => handleSelectWord(token.index)}
                          disabled={status !== "typing"}
                          className={`px-3 py-1.5 rounded-xl border-2 font-bold text-sm tracking-tight transition-all ${stateClass} disabled:cursor-default`}
                        >
                          {token.display}
                        </button>
                      );
                    })}
                  </div>
                  <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50 rounded-full -mr-40 -mt-40 blur-3xl opacity-30" />
                  <div className="absolute bottom-0 left-0 w-80 h-80 bg-zinc-50 rounded-full -ml-40 -mb-40 blur-3xl opacity-30" />
                </div>

                <AnimatePresence>
                  {showLessonPanel && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden md:hidden"
                    >
                      <Card className="p-6 rounded-[2rem] border border-zinc-100 shadow-sm bg-white">
                        {lessonPanelContent}
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-3">
                  <div className="relative flex justify-center">
                    <button
                      type="button"
                      onClick={handleSelectNoError}
                      disabled={status !== "typing"}
                      className={`h-11 px-6 rounded-2xl border-4 font-black text-xs uppercase tracking-widest transition-all shadow-lg disabled:cursor-default ${
                        status === "typing"
                          ? selectedNoError
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-zinc-100 bg-white hover:border-indigo-200"
                          : !currentParsed.hasError && selectedNoError
                          ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                          : !currentParsed.hasError
                          ? "border-emerald-400 bg-emerald-100 text-emerald-900"
                          : selectedNoError
                          ? "border-rose-500 bg-rose-50 text-rose-900"
                          : "border-zinc-100 bg-white text-zinc-400"
                      }`}
                    >
                      Il n'y a pas de faute
                    </button>
                    {status !== "typing" && (
                       <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-lg bg-zinc-900">
                        {status === "correct" ? "Excellent !" : "Presque !"}
                       </div>
                    )}
                  </div>

                  <AnimatePresence>
                    {status === "typing" ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Button
                          onClick={checkCorrection}
                          disabled={selectedWordIndex === null && !selectedNoError}
                          className="w-full h-12 bg-zinc-900 hover:bg-black text-white font-bold rounded-2xl text-sm shadow-xl shadow-zinc-200 transition-all active:scale-95 disabled:opacity-50"
                        >
                          VÉRIFIER MA RÉPONSE
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <Card className={`p-4 rounded-2xl border-none shadow-lg ${status === "correct" ? "bg-emerald-600 text-white" : "bg-zinc-900 text-white"}`}>
                          <div className="flex items-center gap-2 mb-2 opacity-80 text-[9px] font-black uppercase tracking-widest">
                            <Sparkles size={14} /> Note pédagogique
                          </div>
                          <p className="text-xs font-bold leading-relaxed italic mb-2">"{current?.explanation}"</p>
                          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest pt-2 border-t border-white/10">
                            {currentParsed.hasError ? (
                              <>Réponse correcte : <span className="underline decoration-wavy">{current?.correct_word}</span></>
                            ) : (
                              <>Cette phrase ne contient aucune faute.</>
                            )}
                          </div>
                        </Card>

                        <Button
                          onClick={handleNextAction}
                          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                          {currentIdx < totalQuestions - 1 ? "QUESTION SUIVANTE" : "VOIR MON RÉSULTAT"}
                          <ArrowRight size={20} />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </AnimatePresence>
            </div>
          </div>

          {showSplit && (
            <>
              <div
                onPointerDown={onDragStart}
                className="hidden md:flex w-3 shrink-0 cursor-col-resize items-center justify-center group touch-none"
                role="separator"
                aria-orientation="vertical"
                aria-label="Redimensionner les panneaux exercice / leçon"
              >
                <div className="w-1 h-16 rounded-full bg-zinc-200 group-hover:bg-indigo-400 transition-colors" />
              </div>
              <div
                className="hidden md:block md:h-full md:overflow-y-auto md:shrink-0"
                style={{ width: `${100 - leftPct}%` }}
              >
                <Card className="p-6 rounded-[2rem] border border-zinc-100 shadow-sm bg-white">
                  {lessonPanelContent}
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-10">
        <ExerciseLayout
          title="CHASSE AUX ERREURS"
          badge="Coach Repérage d'Erreurs"
          badgeColor="indigo"
          description="Perfectionnez votre conjugaison, grammaire, syntaxe et orthographe en repérant et corrigeant les erreurs. Progressez pas à pas en toute confiance."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 space-y-4 shadow-sm">
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Target size={14} className="text-indigo-600" /> Choisir votre niveau
              </div>
              <div className="flex gap-2">
                {["A1", "A2", "B1", "B2"].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLevel(lvl)}
                    className={`flex-1 h-12 rounded-2xl font-black transition-all ${filters.level === lvl ? 'bg-indigo-600 text-white shadow-lg' : 'bg-zinc-50 text-zinc-400 hover:border-zinc-200'}`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 space-y-4 lg:col-span-2 shadow-sm">
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <GraduationCap size={14} className="text-indigo-600" /> Thématiques
              </div>
              <div className="flex flex-wrap gap-2">
                {["Grammaire", "Conjugaison", "Syntaxe", "Orthographe", "Toutes"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-6 h-12 rounded-2xl font-black text-sm transition-all ${filters.category === cat ? 'bg-zinc-900 text-white shadow-lg' : 'bg-zinc-50 text-zinc-400 hover:border-zinc-200'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div
                onClick={() => {
                    const targetId = recommendedExerciseId
                      ?? catalogue[Math.floor(Math.random() * catalogue.length)]?.id;
                    if (targetId) startTraining(targetId);
                }}
                className="bg-indigo-600 p-6 rounded-[2.5rem] text-white space-y-4 shadow-2xl shadow-indigo-100 relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
                <Zap size={14} /> Recommandé pour vous
              </div>
              <h4 className="text-lg font-black leading-tight">Lancer mon exercice recommandé</h4>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                <Sparkles size={16} /> {recommendationReason || "Basé sur vos performances"}
              </div>
            </div>
          </div>

          <section className="mt-8">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Rechercher un exercice (ex. articles, subjonctif...)"
                  className="w-full h-11 pl-11 pr-4 rounded-2xl border border-zinc-100 bg-white text-sm font-medium text-zinc-700 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200 transition-all"
                />
              </div>
              <button
                type="button"
                onClick={() => setHideCompleted((v) => !v)}
                className={`h-11 px-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
                  hideCompleted
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                    : "bg-white border-zinc-100 text-zinc-400 hover:border-indigo-200"
                }`}
              >
                Non complétés uniquement
              </button>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "recent" | "ancien")}
                className="h-11 px-4 rounded-2xl border border-zinc-100 bg-white text-[10px] font-black uppercase tracking-widest text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200 transition-all"
                aria-label="Trier les exercices"
              >
                <option value="recent">Plus récents</option>
                <option value="ancien">Plus anciens</option>
              </select>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <Badge className="bg-indigo-600 rounded-full px-3 py-1 text-white border-none">Niveau {filters.level}</Badge>
                <span className="text-zinc-400">•</span>
                <span className="capitalize text-zinc-500">{filters.category}</span>
              </h2>
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                {catalogue.length} exercice{catalogue.length > 1 ? 's' : ''} disponible{catalogue.length > 1 ? 's' : ''}
              </div>
            </div>

            {loadingCatalogue ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 rounded-[2rem] bg-zinc-100 animate-pulse" />
                ))}
              </div>
            ) : catalogueError ? (
              <Card className="border-dashed border-2 border-red-200 rounded-[2rem] p-12 text-center bg-red-50/50">
                <AlertTriangle className="mx-auto mb-4 text-red-300" size={40} />
                <p className="font-bold text-zinc-600 mb-4">Impossible de charger les exercices. Vérifiez votre connexion.</p>
                <Button onClick={() => fetchCatalogue()} variant="outline" className="rounded-2xl font-bold">
                  Réessayer
                </Button>
              </Card>
            ) : catalogue.length > 0 ? (
              <GrammarCheckTreeCatalogue
                exercises={catalogue}
                lessonMeta={lessonMeta}
                basePath="/tef-irn/grammar-check"
              />
            ) : (
              <Card className="border-dashed border-2 border-zinc-200 rounded-[2rem] p-12 text-center bg-white shadow-sm">
                <img
                  src={emptyStateMascotUrl}
                  alt="Mascotte LlamaKusi perplexe, aucun exercice trouvé"
                  className="w-24 h-24 mx-auto mb-4 object-contain"
                />
                <p className="font-bold text-zinc-500">Aucun exercice trouvé pour cette sélection.</p>
              </Card>
            )}
          </section>
        </ExerciseLayout>
      </div>
    </div>
  );
}

export default function GrammarCheckPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-zinc-50"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>}>
      <GrammarCheckContent />
    </Suspense>
  );
}
