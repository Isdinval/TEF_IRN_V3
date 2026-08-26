"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PracticeTreeCatalogue, { LessonMeta } from "./components/PracticeTreeCatalogue";
import { Exercise } from "@/lib/parcours";
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronUp,
  ArrowRight,
  BookOpen,
  Target,
  Sparkles,
  Zap,
  GraduationCap,
  RotateCcw,
  Search,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParcours } from '@/contexts/ParcoursContext';
import { ExerciseLayout } from "@/components/shared/ExerciseLayout";
import { LlamaMountainDecoration } from "@/components/decorative/LlamaMountainDecoration";
import { EiffelParisDecoration } from "@/components/decorative/EiffelParisDecoration";
import { ExerciseContextHeader } from "@/components/shared/ExerciseContextHeader";
import { useExerciseFilters } from "@/hooks/useExerciseFilters";
import LessonMarkdown from "@/components/shared/LessonMarkdown";
import { splitTitle } from "@/lib/lessons";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useResizableSplit } from "@/hooks/useResizableSplit";
import { VICTORY_MASCOT_URLS, pickRandomImage } from "@/data/grammar-check-images";
import { resolveNextExercises } from "@/lib/recommendation-resolver";
import { captureEvent } from "@/lib/analytics";

// --- Types ---
interface Question {
  difficulty?: string;
  tags?: string[];
  is_ai_generated?: boolean;
  id: string;
  exercise_id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  level: string;
  category: string;
  instructions: string;
  explanation?: string;
  lesson_id?: string;
  point_cles_lesson?: string;
  // Item 2 du plan "Refonte matching Leçon -> Exercices" : true uniquement quand
  // aucun exercice ciblé (tag précis, ni même leçon canonique -- paliers 1/2 de
  // resolveNextExercises) n'a pu être trouvé et qu'on est retombé sur le pool
  // large de la catégorie (voir autoStart ci-dessous). Sert à afficher un
  // message honnête côté UI plutôt que de laisser croire à un ciblage précis.
  isDegradedMatch?: boolean;
}

interface ExerciseDB {
  difficulty?: string;
  tags?: string[];
  is_ai_generated?: boolean;
  id: string;
  instructions: string;
  type: string;
  category: string;
  level: string;
  lesson_id?: string;
  "point_clés_lesson"?: string;
  isDegradedMatch?: boolean;
  content: {
    explanations?: string[];
    questions: string[];
    options: string[][];
    correct_answers: number[];
  };
}

const CATEGORIES = ["Grammaire", "Conjugaison", "Syntaxe", "Orthographe", "Toutes"];
const LEVELS = ["A1", "A2", "B1", "B2"];

export function PracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const exerciseIdFromParams = params?.id as string | undefined;
  const supabase = createClient();
  const { activeParcours, nextLesson } = useParcours();
  const { filters, setLevel, setCategory } = useExerciseFilters("A2", "Grammaire");

  const [mode, setMode] = useState<"selection" | "practice" | "result">("selection");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);
  // Item 3ter du plan "Refonte matching Leçon -> Exercices" : trace chaque réponse
  // avec l'exercice DB dont elle provient. saveScore() ne pouvait jusqu'ici
  // enregistrer qu'un seul exercise_attempts (celui de questions[0]), même quand
  // la session piochait des sous-questions dans plusieurs exercices différents --
  // les autres exercices réellement pratiqués n'étaient jamais trackés (ni pour
  // l'anti-répétition item 13, ni pour le SRS, ni pour user_errors).
  const [answersLog, setAnswersLog] = useState<{ exerciseId: string; correct: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [catalogue, setCatalogue] = useState<Exercise[]>([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);
  const [catalogueError, setCatalogueError] = useState(false);
  const [saveScoreError, setSaveScoreError] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [hideCompleted, setHideCompleted] = useState(false);
  const [sortOrder, setSortOrder] = useState<"recent" | "ancien">("recent");
  // Titre + order_index de chaque leçon référencée par le catalogue courant, utilisés
  // par PracticeTreeCatalogue pour titrer et trier le niveau 1 de l'arbre.
  const [lessonMeta, setLessonMeta] = useState<Record<string, LessonMeta>>({});
  const [lessonVisible, setLessonVisible] = useState(false);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [lessonCache, setLessonCache] = useState<Record<string, { title: string; content: string }>>({});
  // Titre + slug de leçon (sans le contenu), pour le fil d'Ariane cliquable du
  // bandeau de contexte — toujours visible sans clic, indépendant du panneau
  // complet "Voir la leçon" (lessonCache) qui charge aussi le content markdown.
  const [lessonBreadcrumbById, setLessonBreadcrumbById] = useState<Record<string, { title: string; slug: string }>>({});
  // Slug de chaque parcours (level+category), pour le 1er maillon cliquable du
  // fil d'Ariane. Liste courte (~20 parcours) : un seul fetch, mis en cache.
  const [parcoursSlugs, setParcoursSlugs] = useState<{ slug: string; level: string; category: string }[] | null>(null);
  const [resultMascotUrl, setResultMascotUrl] = useState<string>(VICTORY_MASCOT_URLS[0]);
  const [recommendedExerciseId, setRecommendedExerciseId] = useState<string | null>(null);
  const [recommendationReason, setRecommendationReason] = useState<string | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { leftPct, containerRef: splitContainerRef, onDragStart } = useResizableSplit(50);

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
          setLessonCache(prev => ({ ...prev, [lessonId]: data as { title: string; content: string } }));
          setLessonBreadcrumbById(prev => ({ ...prev, [lessonId]: { title: splitTitle(data.title || "").main, slug: data.slug } }));
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

  const fetchCatalogue = useCallback(async () => {
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
        .in("type", ["qcm", "association", "qcm_centre_entrainement"])
        .eq("level", filters.level);

      if (filters.category !== "Toutes") {
        query = query.ilike("category", `%${filters.category}%`);
      }
      if (searchQuery) query = query.ilike("instructions", `%${searchQuery}%`);
      if (excludeIds.length > 0) query = query.not("id", "in", `(${excludeIds.join(",")})`);

      // Pas de pagination : tout le catalogue filtré est chargé en une fois puis
      // organisé en arbre (leçon > point clé) par PracticeTreeCatalogue, replié
      // par défaut (même approche que GrammarCheckTreeCatalogue).
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
      } else {
        const mapped = (exercises || []).map((ex: any) => ({ ...ex, point_cles_lesson: ex["point_clés_lesson"] }));
        setCatalogue(mapped);
      }
    } catch (err) {
      console.error(err);
      setCatalogueError(true);
    } finally {
      setLoadingCatalogue(false);
    }
  }, [filters.level, filters.category, searchQuery, hideCompleted, sortOrder, supabase]);

  // Debounce de la recherche texte (300ms) pour éviter une requête par frappe.
  useEffect(() => {
    const timeout = setTimeout(() => setSearchQuery(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (mode === "selection") {
      fetchCatalogue();
    }
  }, [fetchCatalogue, mode]);

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
          type: "qcm",
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
    if (mode === "selection") {
      fetchRecommendation();
    }
  }, [fetchRecommendation, mode]);

  const mapExerciseToQuestions = (ex: ExerciseDB): Question[] => {
    if (!ex?.content?.questions) return [];
    return ex.content.questions.map((q, idx) => ({
      id: `${ex.id}-${idx}`,
      exercise_id: ex.id,
      difficulty: ex.difficulty,
      tags: ex.tags,
      is_ai_generated: ex.is_ai_generated,
      text: q,
      options: ex.content.options?.[idx] || [],
      correctAnswer: ex.content.correct_answers?.[idx] ?? 0,
      level: ex.level,
      category: ex.category,
      instructions: ex.instructions,
      explanation: ex.content.explanations?.[idx],
      lesson_id: ex.lesson_id,
      point_cles_lesson: ex["point_clés_lesson"],
      isDegradedMatch: ex.isDegradedMatch,
    }));
  };

  const fetchExerciseById = useCallback(async (exId: string) => {
    setIsLoading(true);
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exId)
      .single();

    if (data) {
      setQuestions(mapExerciseToQuestions(data as ExerciseDB));
      setMode("practice");
    }
    setIsLoading(false);
  }, [supabase]);

  const fetchFromLesson = useCallback(async (lid: string) => {
    setIsLoading(true);
    setScore(0);
    setCurrentIdx(0);
    setSelected(null);
    setIsChecked(false);

    const { data } = await supabase
      .from('exercises')
      .select('*')
      .eq('lesson_id', lid)
      .eq('type', 'qcm')
      .limit(1)
      .single();

    if (data) {
      setQuestions(mapExerciseToQuestions(data as ExerciseDB));
      setMode("practice");
    }
    setIsLoading(false);
  }, [supabase]);

  const fetchReviewExercises = useCallback(async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: attempts } = await supabase
      .from('exercise_attempts')
      .select('exercise_id')
      .eq('user_id', user.id)
      .lt('score', 70)
      .limit(5);

    if (attempts && attempts.length > 0) {
      const ids = attempts.map((a: any) => a.exercise_id);
      const { data: exercises } = await supabase
        .from('exercises')
        .select('*')
        .in('id', ids);

      if (exercises) {
        setQuestions((exercises as ExerciseDB[]).flatMap(mapExerciseToQuestions));
        setMode("practice");
      }
    } else {
      setMode("selection");
    }
    setIsLoading(false);
  }, [supabase]);

  const autoStart = useCallback(async (lid?: string, t?: string, lvl?: string, tag?: string) => {
    setIsLoading(true);
    const level = lvl || filters.level;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Moteur de recommandation unifié (item 7 du plan dashboard) : filtre sur
        // tags (notion précise, ex. "subjonctif présent") en plus de category
        // (large, ex. "Conjugaison"), avec repli sur category seule si le tag ne
        // matche rien -- remplace l'ancien ilike('category', ...) qui ignorait
        // tout tag transmis par le dashboard (perte de précision, cf. analyse
        // du plan "Refonte recommandation erreur -> tag -> ressource").
        let ranked = await resolveNextExercises(
          user.id,
          { level, category: t, tags: tag ? [tag] : undefined, type: 'qcm' },
          supabase,
          10
        );

        // Item 2 du plan "Refonte matching Leçon -> Exercices" : depuis le palier 2
        // (item 1, recommendation-resolver.ts), ce repli ne se déclenche plus que
        // dans le cas réellement dégradé -- aucun exercice au tag exact NI à la
        // leçon canonique du tag (donc `effectiveLessonId` n'a pas pu être dérivé,
        // ou la leçon dérivée n'a elle-même aucun exercice). On le signale
        // explicitement (isDegradedMatch) pour que l'UI ne laisse pas croire à un
        // ciblage précis qu'elle n'a pas pu tenir -- au lieu de rester silencieuse
        // comme avant (bug "présent"/B1 -> exercices sans rapport).
        let isDegradedFallback = false;
        if (ranked.length === 0 && tag) {
          isDegradedFallback = true;
          // Item 5 du plan "Refonte matching Leçon -> Exercices" : log best-effort
          // (non bloquant) à chaque déclenchement réel du palier 3 -- le seul cas
          // encore réellement dégradé après les items 1/3bis. Mesure en prod, sur
          // des couples (topic, tag, level) concrets, où prioriser le comblement
          // de contenu (item 7) plutôt que deviner. Événement client (posthog-js,
          // pattern déjà utilisé ailleurs dans le projet, ex. login/page.tsx) --
          // c'est ici, côté /practice, que le cas se manifeste réellement pour
          // l'utilisateur, contrairement au palier 2 qui reste interne au moteur.
          captureEvent("recommendation_degraded_match", { topic: t, tag, level });
          ranked = await resolveNextExercises(
            user.id,
            { level, category: t, type: 'qcm' },
            supabase,
            10
          );
        }

        if (ranked.length > 0) {
          const { data: fullExercises } = await supabase
            .from('exercises')
            .select('*')
            .in('id', ranked.map(e => e.id));

          if (fullExercises && fullExercises.length > 0) {
            // Préserve l'ordre de pertinence de resolveNextExercises (le fetch
            // par .in() ne garantit pas l'ordre de la liste d'ids fournie).
            // Boucle explicite plutôt qu'une chaîne .map().filter(Boolean).map() :
            // le narrowing via `if (full)` est fiable pour tsc (contrairement à
            // filter(Boolean) seul, qui a cassé le build Vercel du 25/08 avec
            // "Spread types may only be created from object types").
            const byId = new Map<string, ExerciseDB>(
              (fullExercises as ExerciseDB[]).map((e) => [e.id, e])
            );
            const ordered: ExerciseDB[] = [];
            for (const r of ranked) {
              const full = byId.get(r.id);
              if (full) {
                ordered.push({ ...full, isDegradedMatch: isDegradedFallback });
              }
            }
            setQuestions(ordered.flatMap(mapExerciseToQuestions).slice(0, 10));
            setMode("practice");
            return;
          }
        }
      }

      // Repli (utilisateur non connecté, ou aucun exercice trouvé même sans tag) :
      // comportement d'origine conservé tel quel.
      let query = supabase.from('exercises').select('*').eq('type', 'qcm');
      if (t) query = query.ilike('category', `%${t}%`);
      if (level) query = query.eq('level', level);

      const { data } = await query.limit(5);
      if (data && data.length > 0) {
        const allQs = (data as ExerciseDB[]).flatMap(mapExerciseToQuestions);
        setQuestions(allQs.slice(0, 10));
        setMode("practice");
      } else if (t) {
         const { data: searchData } = await supabase
           .from('exercises')
           .select('*')
           .eq('type', 'qcm')
           .filter('instructions', 'ilike', `%${t}%`)
           .limit(1)
           .single();

         if (searchData) {
           setQuestions(mapExerciseToQuestions(searchData as ExerciseDB));
           setMode("practice");
         }
      }
    } catch (err) {
      console.error('autoStart error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, filters.level]);

  useEffect(() => {
    if (mode === "practice") {
      sessionStartRef.current = Date.now();
    }
  }, [mode]);

  // Item 3ter : nouvelle session (nouvelle référence de tableau `questions`,
  // posée par chaque fetch* / autoStart) -> journal de réponses réinitialisé.
  useEffect(() => {
    setAnswersLog([]);
  }, [questions]);

  useEffect(() => {
    const lessonId = searchParams.get('lessonId');
    const topic = searchParams.get('topic');
    const tag = searchParams.get('tag');
    const level = searchParams.get('level');
    const isReviewMode = searchParams.get('mode') === 'review';

    const init = async () => {
      if (exerciseIdFromParams) {
        await fetchExerciseById(exerciseIdFromParams);
      } else if (lessonId && !topic) {
        await fetchFromLesson(lessonId);
      } else if (topic || tag) {
        await autoStart(lessonId || undefined, topic || undefined, level || undefined, tag || undefined);
      } else if (isReviewMode) {
        await fetchReviewExercises();
      } else {
        setMode("selection");
      }
    };
    init();
  }, [exerciseIdFromParams, searchParams, fetchExerciseById, fetchFromLesson, autoStart, fetchReviewExercises]);

  const startTraining = async () => {
    setIsLoading(true);
    let query = supabase.from('exercises').select('*').eq('type', 'qcm');

    query = query.eq('level', filters.level);

    if (filters.category !== "Toutes") {
      query = query.ilike('category', `%${filters.category}%`);
    }

    const { data } = await query.limit(10);
    if (data && data.length > 0) {
      const allQs = (data as ExerciseDB[])
        .flatMap(mapExerciseToQuestions)
        .sort(() => Math.random() - 0.5);
      setQuestions(allQs.slice(0, 10));
      setMode("practice");
    }
    setIsLoading(false);
  };

  const handleBackToCatalogue = () => {
    setMode("selection");
    setScore(0);
    setCurrentIdx(0);
    setSelected(null);
    setIsChecked(false);
    if (params?.id) {
      router.push("/tef-irn/practice");
    }
  };

  const restartExercise = () => {
    setScore(0);
    setCurrentIdx(0);
    setSelected(null);
    setIsChecked(false);
    setLessonVisible(false);
    setSaveScoreError(false);
    if (exerciseIdFromParams) {
      fetchExerciseById(exerciseIdFromParams);
    } else {
      startTraining();
    }
  };

  const handleSelect = (idx: number) => {
    if (isChecked) return;
    setSelected(idx);
  };

  const handleCheck = () => {
    if (selected === null || isChecked) return;
    setIsChecked(true);
    const isCorrect = selected === questions[currentIdx].correctAnswer;
    if (isCorrect) {
      setScore(s => s + 1);
    }
    setAnswersLog(log => [...log, { exerciseId: questions[currentIdx].exercise_id, correct: isCorrect }]);
  };

  const handleNext = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelected(null);
      setIsChecked(false);
      setLessonVisible(false);
    } else {
      const saved = await saveScore();
      setSaveScoreError(!saved);
      setResultMascotUrl(pickRandomImage(VICTORY_MASCOT_URLS));
      setMode("result");
    }
  };

  const saveScore = async (): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return true; // Pas connecté : rien à sauvegarder, pas une erreur.

    const studyTimeMinutes = sessionStartRef.current
      ? Math.round((Date.now() - sessionStartRef.current) / 60000)
      : 0;

    // Item 3ter : un exercise_attempts par exercice DB distinct réellement
    // répondu pendant la session (answersLog), au lieu d'un seul attaché à
    // questions[0] -- sinon les autres exercices pratiqués (souvent 2 à 3 par
    // session sur un pool multi-points) n'étaient jamais enregistrés, cassant
    // silencieusement l'anti-répétition (item 13), le SRS et user_errors pour
    // tout sauf le premier exercice de la liste.
    const byExercise = new Map<string, { correct: number; total: number }>();
    for (const a of answersLog) {
      const entry = byExercise.get(a.exerciseId) || { correct: 0, total: 0 };
      entry.total += 1;
      if (a.correct) entry.correct += 1;
      byExercise.set(a.exerciseId, entry);
    }

    // Repli (ne devrait pas arriver en usage normal, mais évite de perdre la
    // session si answersLog est vide pour une raison quelconque) : comportement
    // d'origine, un seul attempt sur questions[0].
    if (byExercise.size === 0 && questions.length > 0) {
      byExercise.set(questions[0].exercise_id, { correct: score, total: questions.length });
    }

    try {
      const results = await Promise.all(
        Array.from(byExercise.entries()).map(([exerciseId, { correct, total }]) => {
          const finalScore = Math.round((correct / total) * 100);
          return fetch('/api/exercise-complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              exerciseId,
              score: finalScore,
              answers: { correct, total },
              studyTimeMinutes
            })
          });
        })
      );
      return results.every((res) => res.ok);
    } catch (err) {
      console.error("Error saving score:", err);
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 gap-6">
        <div className="relative">
          <Loader2 className="animate-spin text-purple-600" size={64} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-ping" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-black text-zinc-900 uppercase tracking-tighter">Préparation du centre</p>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest animate-pulse italic">Configuration des algorithmes...</p>
        </div>
      </div>
    );
  }

  // SCREEN: RESULT
  if (mode === "result") {
    const finalPercent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8 max-w-md w-full">
          <img
            src={resultMascotUrl}
            alt="Mascotte LlamaKusi célébrant la réussite du QCM"
            className="w-28 h-28 mx-auto object-contain drop-shadow-xl"
          />
          <div className="space-y-2">
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Entraînement terminé !</h2>
            <p className="text-sm text-zinc-500 font-medium">Vous progressez vers votre objectif.</p>
            {(questions[0]?.level || questions[0]?.category) && (
              <div className="flex items-center justify-center gap-2 pt-1">
                {questions[0]?.level && (
                  <Badge className="bg-purple-600 text-white rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest border-none">
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
              <div className="text-2xl font-black text-purple-600">{score} / {questions.length}</div>
            </div>
          </div>
          {saveScoreError && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center gap-3 text-left">
              <AlertTriangle className="text-red-400 shrink-0" size={20} />
              <div className="flex-1">
                <p className="text-xs font-bold text-zinc-600">Ce score n'a pas pu être enregistré.</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => setSaveScoreError(!(await saveScore()))}
                className="rounded-xl font-bold text-xs shrink-0"
              >
                Réessayer
              </Button>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleBackToCatalogue}
              className="h-12 bg-zinc-900 text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-black transition-all"
            >Retourner au catalogue</Button>
            {nextLesson && (
              <Button onClick={() => nextLesson()} variant="outline" className="h-12 border-2 border-zinc-100 rounded-2xl font-bold text-sm text-zinc-600 hover:bg-zinc-50 transition-all">Leçon suivante</Button>
            )}
            <Button
              variant="ghost"
              onClick={restartExercise}
              className="h-12 text-zinc-400 font-black uppercase tracking-widest text-[10px] hover:text-zinc-900"
            >
              <RotateCcw size={14} className="mr-2" /> Recommencer l'exercice
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // SCREEN: SELECTION
  if (mode === "selection") {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8 lg:px-10">
          <ExerciseLayout
            title="CENTRE D’ENTRAÎNEMENT QCM"
            badge="Coach QCM"
            badgeColor="purple"
            description="Renforcez sereinement votre grammaire, conjugaison et vocabulaire grâce à des QCM adaptés au TEF IRN. Construisez votre réussite étape par étape."
          >
            {/* Quick Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-50 p-6 rounded-[2.5rem] border border-zinc-100 space-y-4">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Target size={14} className="text-purple-600" /> Votre Niveau
                </div>
                <div className="flex gap-2">
                  {LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setLevel(lvl)}
                      className={`flex-1 h-12 rounded-2xl font-black transition-all ${filters.level === lvl ? 'bg-purple-600 text-white shadow-lg' : 'bg-white text-zinc-400 border border-zinc-100 hover:border-zinc-200'}`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-50 p-6 rounded-[2.5rem] border border-zinc-100 space-y-4 lg:col-span-2">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <GraduationCap size={14} className="text-purple-600" /> Thématiques
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-6 h-12 rounded-2xl font-black text-sm transition-all ${filters.category === cat ? 'bg-zinc-900 text-white shadow-lg' : 'bg-white text-zinc-400 border border-zinc-100 hover:border-zinc-200'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div
                onClick={() => {
                  if (recommendedExerciseId) {
                    fetchExerciseById(recommendedExerciseId);
                  } else {
                    startTraining();
                  }
                }}
                className="bg-purple-600 p-6 rounded-[2.5rem] text-white space-y-4 shadow-2xl shadow-purple-100 relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
                   <Zap size={14} /> Recommandé pour vous
                </div>
                <h4 className="text-base font-black leading-tight">Lancer mon exercice recommandé</h4>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                    <Sparkles size={16} /> {recommendationReason || "Basé sur vos performances"}
                 </div>
              </div>
            </div>

            {/* Catalogue Section */}
            <section className="mt-8">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Rechercher un exercice (ex. articles, subjonctif...)"
                    className="w-full h-11 pl-11 pr-4 rounded-2xl border border-zinc-100 bg-white text-sm font-medium text-zinc-700 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-200 transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setHideCompleted((v) => !v)}
                  className={`h-11 px-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
                    hideCompleted
                      ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-100"
                      : "bg-white border-zinc-100 text-zinc-400 hover:border-purple-200"
                  }`}
                >
                  Non complétés uniquement
                </button>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "recent" | "ancien")}
                  className="h-11 px-4 rounded-2xl border border-zinc-100 bg-white text-[10px] font-black uppercase tracking-widest text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-200 transition-all"
                  aria-label="Trier les exercices"
                >
                  <option value="recent">Plus récents</option>
                  <option value="ancien">Plus anciens</option>
                </select>
              </div>

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                  <Badge className="bg-purple-600 rounded-full px-3 py-1 text-white border-none">Niveau {filters.level}</Badge>
                  <span className="text-zinc-400">•</span>
                  <span className="capitalize text-zinc-500">{filters.category}</span>
                </h2>
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  {catalogue.length} exercice{catalogue.length > 1 ? 's' : ''} disponible{catalogue.length > 1 ? 's' : ''}
                </div>
              </div>

              {loadingCatalogue ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i: number) => (
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
                <PracticeTreeCatalogue
                  exercises={catalogue}
                  lessonMeta={lessonMeta}
                  basePath="/tef-irn/practice"
                />
              ) : (
                <Card className="border-dashed border-2 border-zinc-200 rounded-[2rem] p-12 text-center bg-zinc-50/50">
                  <Target className="mx-auto mb-4 text-zinc-300" size={40} />
                  <p className="font-bold text-zinc-500">Aucun exercice trouvé pour cette sélection.</p>
                </Card>
              )}
            </section>
          </ExerciseLayout>
        </div>
      </div>
    );
  }

  // SCREEN: PRACTICE (Exercise Loop)
  if (mode === "practice") {
    const currentQuestion = questions[currentIdx];
    const totalQuestions = questions.length;
    const progress = ((currentIdx + 1) / totalQuestions) * 100;
    const activeLesson = currentQuestion?.lesson_id ? lessonCache[currentQuestion.lesson_id] : undefined;
    const showLessonPanel = lessonVisible && !!activeLesson;
    const showSplit = showLessonPanel && isDesktop;
    const lessonPanelContent = activeLesson ? (
      <>
        <div className="flex items-center gap-2 mb-1 text-[10px] font-black uppercase tracking-widest text-purple-600">
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
        <LlamaMountainDecoration variant="practice" />
        <EiffelParisDecoration variant="practice" />
        <ExerciseLayout
          variant="compact"
          title="CENTRE D’ENTRAÎNEMENT QCM"
          badge="Coach QCM"
          badgeColor="purple"
          onBack={handleBackToCatalogue}
          rightElement={
            <div className="hidden md:flex items-center gap-6">
              {currentQuestion?.lesson_id && (
                <Button
                  onClick={() => toggleLesson(currentQuestion.lesson_id)}
                  variant="outline"
                  className="h-10 rounded-xl border-2 border-purple-100 bg-purple-50 text-purple-600 font-black text-[10px] uppercase tracking-widest hover:bg-purple-100"
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
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Précision</div>
                <div className="text-2xl font-black text-zinc-900">{score} / {totalQuestions}</div>
              </div>
              <div className="h-12 w-px bg-zinc-100" />
              <div className="flex flex-col gap-2">
                 <div className="w-48 h-3 bg-zinc-100 rounded-full overflow-hidden border border-zinc-50 shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-purple-600"
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
                    category={currentQuestion?.category}
                    level={currentQuestion?.level}
                    difficulty={currentQuestion?.difficulty}
                    instructions={currentQuestion?.instructions}
                    pointCle={currentQuestion?.point_cles_lesson}
                    parcoursLabel={currentQuestion ? `${currentQuestion.category} ${currentQuestion.level}` : undefined}
                    parcoursHref={(() => {
                      const slug = getParcoursSlug(currentQuestion?.level, currentQuestion?.category);
                      return slug ? `/tef-irn/parcours/${slug}` : undefined;
                    })()}
                    lessonTitle={currentQuestion?.lesson_id ? lessonBreadcrumbById[currentQuestion.lesson_id]?.title : undefined}
                    lessonHref={
                      currentQuestion?.lesson_id && lessonBreadcrumbById[currentQuestion.lesson_id]?.slug
                        ? `/tef-irn/lessons/${lessonBreadcrumbById[currentQuestion.lesson_id].slug}`
                        : undefined
                    }
                    accentColor="purple"
                    degradedMatchNotice={
                      currentQuestion?.isDegradedMatch
                        ? `Pas d'exercice ciblé pour cette notion précise : voici des exercices de ${currentQuestion.category} ${currentQuestion.level} pour t'entraîner sur des notions proches.`
                        : undefined
                    }
                  />

                  {/* Question Text */}
                  <div className="bg-white p-4 lg:p-5 rounded-[2rem] shadow-xl shadow-zinc-200/30 text-center relative overflow-hidden border-4 border-white ring-1 ring-zinc-100">
                   <h3 className="text-base lg:text-lg font-black text-zinc-900 leading-tight tracking-tight relative z-10">
                    {currentQuestion?.text}
                  </h3>
                  <div className="absolute top-0 right-0 w-80 h-80 bg-purple-50 rounded-full -mr-40 -mt-40 blur-3xl opacity-30" />
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

                {/* Options Grid */}
                <div className="grid grid-cols-1 gap-2">
                   <p className="text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Sélectionnez la bonne réponse</p>
                  {currentQuestion?.options.map((option: string, i: number) => {
                    const isCorrect = i === currentQuestion.correctAnswer;
                    const isSelected = selected === i;

                    let buttonStyle = "border-zinc-100 bg-white text-zinc-600 hover:border-zinc-300 shadow-sm";
                    if (isChecked) {
                      if (isCorrect) buttonStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-none ring-4 ring-emerald-500/10";
                      else if (isSelected) buttonStyle = "border-rose-500 bg-rose-50 text-rose-900 shadow-none ring-4 ring-rose-500/10";
                    } else if (isSelected) {
                      buttonStyle = "border-purple-600 bg-purple-50 text-purple-900 shadow-xl ring-4 ring-purple-600/5";
                    }

                    return (
                      <motion.button
                        key={i}
                        whileHover={!isChecked ? { x: 5 } : {}}
                        whileTap={!isChecked ? { scale: 0.98 } : {}}
                        onClick={() => handleSelect(i)}
                        className={`w-full p-2.5 rounded-xl border-2 transition-all text-left font-bold text-sm flex items-center justify-between group ${buttonStyle}`}
                        disabled={isChecked}
                      >
                        <div className="flex items-center gap-3">
                           <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs transition-colors ${isSelected ? 'bg-purple-600 text-white' : 'bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200'}`}>
                              {String.fromCharCode(65 + i)}
                           </div>
                           {option}
                        </div>
                        {isChecked && isCorrect && <CheckCircle2 className="text-emerald-500" size={18} />}
                        {isChecked && isSelected && !isCorrect && <XCircle className="text-rose-500" size={18} />}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Action Bar */}
                <div className="pt-1">
                  {!isChecked ? (
                    <Button
                      onClick={handleCheck}
                      disabled={selected === null}
                      className="w-full h-12 bg-zinc-900 hover:bg-black text-white font-bold rounded-2xl text-sm shadow-xl shadow-zinc-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                      VÉRIFIER MA RÉPONSE
                    </Button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                       {currentQuestion.explanation && (
                         <Card className={`p-4 rounded-2xl border-none shadow-lg ${selected === currentQuestion.correctAnswer ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-white'}`}>
                            <div className="flex items-center gap-2 mb-1 opacity-80 text-[9px] font-black uppercase tracking-widest">
                               <Sparkles size={14} /> Note pédagogique
                            </div>
                            <p className="text-xs font-bold leading-relaxed italic">"{currentQuestion.explanation}"</p>
                         </Card>
                       )}

                      <Button
                        onClick={handleNext}
                        className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl text-sm shadow-xl shadow-purple-200 transition-all active:scale-95 flex items-center justify-center gap-3"
                      >
                        {currentIdx < totalQuestions - 1 ? "QUESTION SUIVANTE" : "VOIR MON RÉSULTAT"}
                        <ArrowRight size={20} />
                      </Button>
                    </motion.div>
                  )}
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
                <div className="w-1 h-16 rounded-full bg-zinc-200 group-hover:bg-purple-400 transition-colors" />
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

  return null;
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-zinc-50"><Loader2 className="animate-spin text-purple-600" size={48} /></div>}>
      <PracticeContent />
    </Suspense>
  );
}
