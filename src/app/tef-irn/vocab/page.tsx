"use client";

import { useState, useEffect, Suspense, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import VocabCatalogueTable from "./components/VocabCatalogueTable";
import VocabAudioButton from "./components/VocabAudioButton";
import VocabLevelSwitcher from "./components/VocabLevelSwitcher";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { completionCardStyles, CompletionBadge } from "@/components/ui/CompletionVisuals";
import {
  ArrowRight,
  Loader2,
  Sparkles,
  Trophy,
  Brain,
  Target,
  GraduationCap,
  Calendar,
  RotateCcw,
  AlertTriangle
} from "lucide-react";
import { updateVocabularySRS } from "@/lib/srs-engine";
import { motion, AnimatePresence } from "framer-motion";
import { validateVocabResponse } from "@/lib/vocab/utils";
import { VOCAB_CATEGORIES } from "@/lib/vocab/categories";
import { useParcours } from "@/contexts/ParcoursContext";
import { ExerciseLayout } from "@/components/shared/ExerciseLayout";
import { LlamaMountainDecoration } from "@/components/decorative/LlamaMountainDecoration";
import { DestinationLandmarkDecoration } from "@/components/decorative/DestinationLandmarkDecoration";
import { useExerciseFilters } from "@/hooks/useExerciseFilters";

interface Flashcard {
  id: string;
  word: string;
  definition: string;
  example: string;
  level: string;
  category: string;
  audio_url?: string | null;
}

type Step = "presentation" | "quiz" | "type";

const LEVEL_SWITCHER_HINT_KEY = "vocab_level_switcher_hint_seen";

export function VocabCoachContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const exerciseIdFromParams = (params?.id as string) || searchParams.get("id");

  const supabase = useMemo(() => createClient(), []);
  const { nextLesson } = useParcours();
  const { filters, setLevel, setCategory } = useExerciseFilters("A2", "Administration");

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<Step>("presentation");
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [catalogue, setCatalogue] = useState<any[]>([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);
  const [catalogueError, setCatalogueError] = useState(false);
  const [mode, setMode] = useState<"selection" | "training">("selection");
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [sessionMasteredCount, setSessionMasteredCount] = useState(0);
  // Nombre réel de mots dus à révision aujourd'hui, tous niveaux/thématiques
  // confondus (reflète le comportement effectif de startTraining(true), qui
  // ignore les filtres level/category sur son chemin principal — cf. analyse).
  const [reviewDueCount, setReviewDueCount] = useState<number | null>(null);
  // Item 5 du plan "Changement de niveau sans quitter le thème (B+D)" :
  // indice de découvrabilité du switcher, affiché uniquement à la 1re
  // arrivée via une carte parcours (?lessonId&topic&level) et jamais revu
  // ensuite. Stocké en localStorage (pas en base) -- pur indice UI, pas une
  // donnée utilisateur à synchroniser entre appareils.
  const [showLevelSwitcherHint, setShowLevelSwitcherHint] = useState(false);

  // Quiz state
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);

  // Type state
  const [userInput, setUserInput] = useState("");
  const [typeChecked, setTypeChecked] = useState(false);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; toleranceApplied: boolean; message?: string } | null>(null);

  const hasInitialized = useRef(false);
  const isFetchingCatalogue = useRef(false);

  const catalogueScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Regroupe le catalogue par catégorie (ordre = VOCAB_CATEGORIES, catégories
  // absentes du résultat filtrées). Utilisé pour afficher chaque thématique
  // comme une section accordéon indépendante (toute la page, pas de pagination).
  // isFullyMastered signale qu'une thématique est 100% maîtrisée (tous les mots
  // au statut "mastered") pour afficher un indicateur visuel sans avoir à
  // ouvrir l'accordéon (cf. CompletionVisuals, réutilisé tel quel).
  const catalogueGroups = useMemo(() => {
    return VOCAB_CATEGORIES
      .map((cat) => {
        const items = catalogue.filter((item) => item.category === cat);
        return { category: cat, items, isFullyMastered: items.length > 0 && items.every((item) => item.status === "mastered") };
      })
      .filter((group) => group.items.length > 0);
  }, [catalogue]);

  // Nombre de mots du filtre actuel effectivement servis par "Apprendre mes
  // mots" (qui exclut désormais les mots déjà maîtrisés) — utilisé pour le
  // sous-titre chiffré du CTA, afin qu'il reste honnête vis-à-vis du résultat.
  const unmasteredCatalogueCount = useMemo(
    () => catalogue.filter((item) => item.status !== "mastered").length,
    [catalogue]
  );

  const fetchCatalogue = useCallback(async () => {
    if (isFetchingCatalogue.current) return;
    isFetchingCatalogue.current = true;
    setLoadingCatalogue(true);
    setCatalogueError(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from("vocabulary")
        .select("*")
        .eq("level", filters.level);

      if (filters.category !== "Toutes") {
        query = query.ilike("category", `%${filters.category}%`);
      }

      const { data: items } = await query;

      if (items && user) {
        const { data: reviews } = await supabase
          .from("user_vocabulary_reviews")
          .select("vocab_id, consecutive_correct")
          .eq("user_id", user.id)
          .in("vocab_id", items.map((i: any) => i.id));

        // Même seuil de maîtrise que CivicCatalogue.tsx (consecutive_correct >= 2)
        // pour garder une définition de "mot appris" cohérente entre les 2 verticales.
        const mapped = items.map((item: any) => {
          const review = reviews?.find((r: any) => r.vocab_id === item.id);
          const status: "new" | "learning" | "mastered" = !review
            ? "new"
            : (review.consecutive_correct || 0) >= 2
            ? "mastered"
            : "learning";
          return { ...item, status };
        });
        setCatalogue(mapped);
      } else {
        setCatalogue((items || []).map((item: any) => ({ ...item, status: "new" as const })));
      }
    } catch (err) {
      console.error("Error fetching catalogue:", err);
      setCatalogueError(true);
    } finally {
      setLoadingCatalogue(false);
      isFetchingCatalogue.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.level, filters.category, supabase]);

  // Compte réel des mots dus à révision aujourd'hui, désormais scopé aux
  // filtres level/category — cf. startTraining, qui respecte maintenant ces
  // filtres sur le chemin "review" (avant : comptage global, indépendant des
  // filtres). 2 requêtes (candidats du filtre, puis comptage des reviews
  // dues parmi ces IDs) plutôt qu'un embed PostgREST, pour rester cohérent
  // avec le pattern déjà utilisé dans fetchCatalogue().
  const fetchReviewDueCount = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setReviewDueCount(0); return; }

      let candidatesQuery = supabase.from("vocabulary").select("id").eq("level", filters.level);
      if (filters.category !== "Toutes") candidatesQuery = candidatesQuery.eq("category", filters.category);
      const { data: candidates } = await candidatesQuery;
      const candidateIds = (candidates || []).map((c: any) => c.id);
      if (candidateIds.length === 0) { setReviewDueCount(0); return; }

      const { count } = await supabase
        .from("user_vocabulary_reviews")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .lte("next_review_at", new Date().toISOString())
        .in("vocab_id", candidateIds);

      setReviewDueCount(count ?? 0);
    } catch (err) {
      console.error("Error fetching review due count:", err);
      setReviewDueCount(0);
    }
  }, [supabase, filters.level, filters.category]);

  useEffect(() => {
    if (mode === "selection") {
      fetchCatalogue();
      fetchReviewDueCount();
    }
  }, [fetchCatalogue, fetchReviewDueCount, mode]);

  const startSpecificCard = useCallback(async (id: string) => {
    setLoading(true);
    try {
        const { data, error } = await supabase
            .from("vocabulary")
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;
        if (!data) throw new Error("Card not found");

        setCards([data as Flashcard]);
        setMode("training");
        setIndex(0);
        setStep("presentation");
        setFinished(false);
        setSessionMasteredCount(0);
        setFlipped(false);
    } catch (err) {
        console.error("Error loading specific card:", err);
        setMode("selection");
    } finally {
        setLoading(false);
    }
  }, [supabase]);

  const startTraining = useCallback(async (review: boolean = false, lvl?: string, cat?: string) => {
    setLoading(true);
    try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;

        const targetLvl = lvl || filters.level;
        const targetCat = cat || filters.category;

        let data: any[] | null = null;

        if (review && user) {
            setIsReviewMode(true);
            const { data: reviews } = await supabase
                .from('user_vocabulary_reviews')
                .select('vocab_id')
                .eq('user_id', user.id)
                .lte('next_review_at', new Date().toISOString())
                .limit(10);

            if (reviews && reviews.length > 0) {
                // Les mots dus sont maintenant aussi filtrés par niveau/thématique
                // (avant : ignorait totalement les filtres affichés à l'écran).
                let dueQuery = supabase.from('vocabulary').select('*').in('id', reviews.map((r: any) => r.vocab_id)).eq('level', targetLvl);
                if (targetCat !== "Toutes") dueQuery = dueQuery.eq('category', targetCat);
                const { data: dueData, error: dueErr } = await dueQuery;
                if (dueErr) throw dueErr;
                data = dueData;
            } else {
                let fallbackQuery = supabase.from('vocabulary').select('*').eq('level', targetLvl);
                if (targetCat !== "Toutes") fallbackQuery = fallbackQuery.eq('category', targetCat);
                const { data: fallbackData, error: fallbackErr } = await fallbackQuery.limit(10);
                if (fallbackErr) throw fallbackErr;
                data = fallbackData;
            }
        } else {
            setIsReviewMode(false);
            // 2 requêtes (candidats du niveau/catégorie, puis reviews de
            // l'utilisateur sur ces candidats) pour exclure côté client les
            // mots déjà maîtrisés (consecutive_correct >= 2) — même pattern
            // que fetchCatalogue(), pas de nouvelle technique introduite.
            let candidatesQuery = supabase.from('vocabulary').select('*').eq('level', targetLvl);
            if (targetCat !== "Toutes") candidatesQuery = candidatesQuery.eq('category', targetCat);
            const { data: candidates, error: candErr } = await candidatesQuery.order('word', { ascending: true });
            if (candErr) throw candErr;

            let pool = candidates || [];
            if (user && pool.length > 0) {
                const { data: masteryReviews } = await supabase
                    .from('user_vocabulary_reviews')
                    .select('vocab_id, consecutive_correct')
                    .eq('user_id', user.id)
                    .in('vocab_id', pool.map((c: any) => c.id));
                const masteredIds = new Set(
                    (masteryReviews || [])
                        .filter((r: any) => (r.consecutive_correct || 0) >= 2)
                        .map((r: any) => r.vocab_id)
                );
                pool = pool.filter((c: any) => !masteredIds.has(c.id));
            }
            data = pool.slice(0, 10);
        }

        if (data && data.length > 0) {
            setCards(data as Flashcard[]);
            setMode("training");
            setIndex(0);
            setStep("presentation");
            setFinished(false);
            setSessionMasteredCount(0);
            setFlipped(false);
        } else {
            setMode("selection");
        }
    } catch (err) {
        console.error("Error starting training:", err);
        setMode("selection");
    } finally {
        setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.level, filters.category, supabase]);

  // Changement de niveau sans quitter le thème en cours (même category,
  // filters.category inchangé) -- corrige l'absence de tout sélecteur de
  // niveau en mode "training" (seul moyen avant : bouton retour, qui
  // renvoie à l'écran de sélection). Réutilise startTraining tel quel,
  // avec le même review/category, seul le niveau change.
  const handleLevelSwitch = useCallback((newLevel: string) => {
    if (newLevel === filters.level) return;
    setLevel(newLevel);
    startTraining(isReviewMode, newLevel, filters.category);
    // Dès le 1er clic (quel que soit le niveau choisi), l'indice a rempli son
    // rôle -- ne plus jamais le réafficher pour cet utilisateur.
    if (showLevelSwitcherHint) {
      setShowLevelSwitcherHint(false);
      try { localStorage.setItem(LEVEL_SWITCHER_HINT_KEY, "1"); } catch { /* localStorage indisponible, tant pis */ }
    }
  }, [filters.level, filters.category, isReviewMode, setLevel, startTraining, showLevelSwitcherHint]);

  useEffect(() => {
    if (hasInitialized.current) return;
    if (mode !== "selection" || loading) return;

    if (exerciseIdFromParams) {
        hasInitialized.current = true;
        startSpecificCard(exerciseIdFromParams);
    } else {
        const lessonId = searchParams.get("lessonId");
        const topic = searchParams.get("topic");
        const level = searchParams.get("level");
        const isReviewMode = searchParams.get("review") === "true";

        if (lessonId && topic) {
            hasInitialized.current = true;
            setLevel(level || filters.level);
            setCategory(topic);
            startTraining(false, level || filters.level, topic);
            try {
              if (!localStorage.getItem(LEVEL_SWITCHER_HINT_KEY)) setShowLevelSwitcherHint(true);
            } catch { /* localStorage indisponible, pas d'indice affiché -- pas bloquant */ }
        } else if (isReviewMode) {
            hasInitialized.current = true;
            startTraining(true, level || filters.level);
        }
    }
  }, [exerciseIdFromParams, searchParams, startSpecificCard, startTraining, setLevel, setCategory, filters.level, mode, loading]);

  const handleStepComplete = async (isCorrect: boolean) => {
    if (isCorrect && step === "type") {
      setSessionMasteredCount(prev => prev + 1);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await updateVocabularySRS(user.id, cards[index].id, true);
      }
    }

    // Symétrique du bloc ci-dessus : jusqu'ici un échec au step "type" ne
    // faisait que renvoyer à la présentation du mot sans jamais persister
    // l'échec (ease_factor jamais abaissé en base) -- le mot revenait donc
    // avec le même intervalle SRS qu'un mot maîtrisé, et aucun signal de
    // difficulté n'était disponible pour analyzeVocabStruggleAndRecommend().
    if (!isCorrect && step === "type") {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await updateVocabularySRS(user.id, cards[index].id, false);
        fetch('/api/vocab/track-struggle', { method: 'POST' }).catch(() => {});
      }
    }

    if (isCorrect) {
      if (step === "presentation") {
        try {
            const distractorsQuery = supabase.from("vocabulary").select("definition").neq("id", cards[index].id).limit(20);
            const { data: distractorsData } = await distractorsQuery;
            const distractors = (distractorsData?.map((d: any) => d.definition) || []).sort(() => 0.5 - Math.random()).slice(0, 3);
            const options = [...distractors, cards[index].definition].sort(() => 0.5 - Math.random());

            setQuizOptions(options);
            setStep("quiz");
            setFlipped(false);
            setSelectedOption(null);
            setQuizChecked(false);
        } catch (err) {
            console.error("Error generating distractors:", err);
            setStep("type");
            setUserInput("");
            setTypeChecked(false);
            setValidationResult(null);
        }
      } else if (step === "quiz") {
        setStep("type");
        setUserInput("");
        setTypeChecked(false);
        setValidationResult(null);
      } else if (step === "type") {
        if (index < cards.length - 1) {
          setIndex(index + 1);
          setStep("presentation");
          setFlipped(false);
        } else {
          setFinished(true);
        }
      }
    } else {
      setStep("presentation");
      setFlipped(false);
    }
  };

  const handleSkip = () => {
    if (index < cards.length - 1) {
      setIndex(index + 1);
      setStep("presentation");
      setFlipped(false);
    } else {
      setFinished(true);
    }
  };

  const handleBack = () => {
    if (mode === "selection") {
        router.back();
    } else {
        setMode("selection");
        if (params?.id) {
            router.push("/tef-irn/vocab");
        }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-emerald-600 mx-auto mb-4" size={48} />
        <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">Préparation de la session...</p>
      </div>
    </div>
  );

  if (finished) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8 max-w-md w-full">
          <div className="w-20 h-20 bg-emerald-600 rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-2xl shadow-emerald-200">
            <Trophy size={36} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Session terminée !</h2>
            <p className="text-sm text-zinc-500 font-medium">Vous avez maîtrisé {sessionMasteredCount} nouveaux mots.</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-zinc-100 flex items-center justify-around">
            <div className="text-center">
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Mots vus</div>
              <div className="text-2xl font-black text-zinc-900">{cards.length}</div>
            </div>
            <div className="w-px h-10 bg-zinc-100" />
            <div className="text-center">
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Maîtrisés</div>
              <div className="text-2xl font-black text-emerald-600">{sessionMasteredCount}</div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={() => { setFinished(false); setMode("selection"); }} className="h-12 bg-zinc-900 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-black transition-all">Retourner au catalogue</Button>
            {nextLesson && (
              <Button onClick={() => nextLesson()} variant="outline" className="h-12 border-2 border-zinc-100 rounded-2xl font-black text-sm text-zinc-600 hover:bg-zinc-50 transition-all">Leçon suivante</Button>
            )}
            <Button
                variant="ghost"
                onClick={() => {
                    if (exerciseIdFromParams) startSpecificCard(exerciseIdFromParams);
                    else startTraining();
                }}
                className="h-12 text-zinc-400 font-black uppercase tracking-widest text-[10px] hover:text-zinc-900"
              >
                <RotateCcw size={14} className="mr-2" /> Recommencer la session
              </Button>
          </div>

          {/* Item 3 du plan "Changement de niveau sans quitter le thème (B+D)" :
              propose de poursuivre le même thème à un autre niveau plutôt
              qu'un simple retour générique au catalogue -- même thème,
              vocabulary a toujours les 4 niveaux remplis (vérifié en base). */}
          {filters.category !== "Toutes" && (
            <VocabLevelSwitcher
              currentLevel={filters.level}
              onSelectLevel={handleLevelSwitch}
              variant="card"
            />
          )}
        </motion.div>
      </div>
    );
  }

  if (mode === "training") {
    const current = cards[index];
    const progress = cards.length > 0 ? ((index + 1) / cards.length) * 100 : 0;

    return (
      <div className="relative h-full bg-zinc-50 flex flex-col">
        <LlamaMountainDecoration variant="vocab" />
        <DestinationLandmarkDecoration variant="vocab" />
        <ExerciseLayout
          variant="compact"
          title="COACH VOCABULAIRE"
          badge="Coach Vocabulaire"
          badgeColor="emerald"
          onBack={handleBack}
          rightElement={
            <div className="hidden md:flex items-center gap-6">
              <div className="text-right">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Progression</div>
                <div className="text-2xl font-black text-zinc-900">{index + 1} / {cards.length}</div>
              </div>
              <div className="h-12 w-px bg-zinc-100" />
              <div className="flex flex-col gap-2">
                 <div className="w-48 h-3 bg-zinc-100 rounded-full overflow-hidden border border-zinc-50 shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-emerald-600"
                    />
                 </div>
                 <div className="flex justify-between text-[8px] font-black text-zinc-300 uppercase tracking-widest">
                    <span>{Math.round(progress)}% complété</span>
                 </div>
              </div>
            </div>
          }
        />

        {/* Item 2 du plan "Changement de niveau sans quitter le thème (B+D)" :
            seul point d'accès à un changement de niveau depuis le mode
            entraînement -- avant, uniquement possible via "retour" (perte
            de contexte visuel du thème en cours). */}
        <div className="max-w-5xl mx-auto w-full px-4 lg:px-12 pt-4 flex flex-col items-end gap-2">
          <div className="w-full flex items-center justify-between flex-wrap gap-3">
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              Thème : <span className="text-zinc-700">{filters.category}</span>
            </div>
            <VocabLevelSwitcher currentLevel={filters.level} onSelectLevel={handleLevelSwitch} />
          </div>
          {/* Item 5 : indice de découvrabilité, 1re visite via carte parcours
              uniquement, disparaît au 1er clic sur le switcher (cf.
              handleLevelSwitch). */}
          {showLevelSwitcherHint && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-bold text-emerald-600 italic"
            >
              ↑ Vous pouvez aussi explorer ce thème aux autres niveaux
            </motion.p>
          )}
        </div>

        <main className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 overflow-y-auto">
           <AnimatePresence mode="wait">
          {step === "presentation" && (
            <motion.div
              key="presentation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full max-w-2xl flex flex-col items-center gap-6"
            >
              <div
                className="relative w-full h-[340px] cursor-pointer perspective-1000 group"
                onClick={() => setFlipped(!flipped)}
              >
                <div className={`
                  relative w-full h-full transition-transform duration-700 transform-style-3d
                  ${flipped ? 'rotate-y-180' : ''}
                `}>
                  <Card className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-8 border-none shadow-2xl shadow-zinc-200 rounded-[2.5rem] group-hover:shadow-emerald-100 transition-all duration-500 bg-white text-center">
                    <div className="absolute top-6 inset-x-0 flex items-center justify-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest">{current?.category}</span>
                      <span className="px-3 py-1 rounded-full bg-zinc-50 text-zinc-500 text-[9px] font-black uppercase tracking-widest">{current?.level}</span>
                    </div>
                    <h2 className="text-[clamp(1.5rem,3vw+0.75rem,2.25rem)] font-black text-zinc-900 mb-4 tracking-tighter">{current?.word}</h2>
                    <VocabAudioButton audioUrl={current?.audio_url} variant="light" onPlay={() => setFlipped(true)} />
                    <div className="absolute bottom-8 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider">
                      <RotateCcw size={14} /> Cliquer pour révéler
                    </div>
                  </Card>

                  <Card className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8 border-none bg-zinc-900 text-white shadow-2xl rounded-[2.5rem] overflow-hidden text-center">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                       <div className="absolute -top-24 -right-24 w-64 h-64 bg-white rounded-full blur-3xl" />
                       <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500 rounded-full blur-3xl" />
                    </div>
                    <div className="absolute top-6 inset-x-0 flex items-center justify-center gap-2 z-10">
                      <span className="px-3 py-1 rounded-full bg-white/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest">{current?.category}</span>
                      <span className="px-3 py-1 rounded-full bg-white/10 text-white text-[9px] font-black uppercase tracking-widest">{current?.level}</span>
                    </div>
                    <div className="text-center space-y-6 z-10">
                      <div className="space-y-3 flex flex-col items-center">
                        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Définition</div>
                        <VocabAudioButton audioUrl={current?.audio_url} variant="dark" className="h-10 w-10" />
                        <p className="text-base font-bold leading-tight tracking-tight text-white">{current?.definition}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em]">Exemple</div>
                        <p className="text-sm italic text-zinc-300 bg-white/5 p-4 rounded-2xl border border-white/10 leading-relaxed font-medium">
                          "{current?.example}"
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
              <div className="flex gap-4 w-full max-w-lg">
                <Button
                  onClick={handleSkip}
                  variant="secondary"
                  className="h-12 flex-1 bg-zinc-100 text-zinc-600 font-black rounded-2xl text-sm hover:bg-zinc-200"
                >
                  Passer
                </Button>
                <Button
                  onClick={() => handleStepComplete(true)}
                  className="h-12 flex-[2] bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 text-sm"
                >
                  C'est compris <ArrowRight className="ml-2" size={16} />
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
              className="w-full max-w-lg mx-auto space-y-8"
            >
              <div className="text-center space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Quelle est la définition de</p>
                <h2 className="text-[clamp(1.25rem,2vw+0.75rem,1.75rem)] font-black text-zinc-900 tracking-tighter">"{current?.word}" ?</h2>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {quizOptions.map((opt, i) => (
                  <button
                    key={i}
                    disabled={quizChecked}
                    onClick={() => setSelectedOption(opt)}
                    className={`
                      w-full p-4 rounded-2xl border-2 text-left transition-all font-bold text-sm leading-snug
                      ${selectedOption === opt ? 'border-emerald-600 bg-emerald-50 text-emerald-900' : 'border-zinc-100 bg-white text-zinc-600 hover:border-zinc-300'}
                      ${quizChecked && opt === current?.definition ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : ''}
                      ${quizChecked && selectedOption === opt && opt !== current?.definition ? 'border-rose-500 bg-rose-50 text-rose-900' : ''}
                    `}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {!quizChecked ? (
                <div className="flex gap-4">
                  <Button
                    onClick={handleSkip}
                    variant="secondary"
                    className="h-12 flex-1 bg-zinc-100 text-zinc-600 font-black text-sm rounded-2xl hover:bg-zinc-200"
                  >
                    Passer
                  </Button>
                  <Button
                    disabled={!selectedOption}
                    onClick={() => setQuizChecked(true)}
                    className="h-12 flex-[2] bg-zinc-900 text-white font-black text-sm rounded-2xl"
                  >
                    Vérifier
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => handleStepComplete(selectedOption === current?.definition)}
                  className={`w-full h-12 text-sm text-white font-black rounded-2xl ${selectedOption === current?.definition ? 'bg-emerald-600' : 'bg-red-500'}`}
                >
                  {selectedOption === current?.definition ? "Continuer" : "Réessayer le mot"} <ArrowRight className="ml-2" size={16} />
                </Button>
              )}
            </motion.div>
          )}

          {step === "type" && (
            <motion.div
              key="type"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-lg mx-auto space-y-6"
            >
              <div className="text-center space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Écrivez le mot correspondant à</p>
                <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 italic text-base font-medium text-zinc-700">
                  "{current?.definition}"
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !typeChecked && userInput.trim() && (async () => {
                    const res = validateVocabResponse(userInput, current?.word);
                    setValidationResult(res);
                    setTypeChecked(true);
                  })()}
                  disabled={typeChecked}
                  autoFocus
                  placeholder="Tapez le mot ici..."
                  className={`h-14 text-center text-[clamp(1rem,1.5vw+0.5rem,1.25rem)] font-black rounded-2xl border-4 transition-all ${
                    typeChecked
                    ? (validationResult?.isValid ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-rose-500 bg-rose-50 text-rose-900')
                    : 'border-zinc-200 focus:border-emerald-600 bg-white'
                  }`}
                />

                {!typeChecked ? (
                  <div className="flex gap-4">
                    <Button
                      onClick={handleSkip}
                      variant="secondary"
                      className="h-12 flex-1 bg-zinc-100 text-zinc-600 font-black text-sm rounded-2xl hover:bg-zinc-200"
                    >
                      Passer
                    </Button>
                    <Button
                      disabled={!userInput.trim()}
                      onClick={() => {
                        const res = validateVocabResponse(userInput, current?.word);
                        setValidationResult(res);
                        setTypeChecked(true);
                      }}
                      className="h-12 flex-[2] bg-zinc-900 text-white font-black text-sm rounded-2xl"
                    >
                      Valider
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className={`text-center p-3 rounded-xl font-bold text-sm ${validationResult?.isValid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                         {validationResult?.isValid ? (validationResult.message || "Excellent !") : "Presque ! Réessayez (attention à l'orthographe)"}
                    </div>
                    {!validationResult?.isValid && (
                      <div className="text-center p-4 bg-rose-50 rounded-xl text-rose-600 font-bold text-sm">
                        La bonne réponse était : <span className="text-base uppercase underline decoration-2">{current?.word}</span>
                      </div>
                    )}
                    <Button
                      onClick={() => handleStepComplete(validationResult?.isValid || false)}
                      className={`w-full h-12 text-sm text-white font-black rounded-2xl ${validationResult?.isValid ? 'bg-emerald-600' : 'bg-red-500'}`}
                    >
                      {validationResult?.isValid ? "Maîtrisé !" : "Reprendre du début"} <ArrowRight className="ml-2" size={16} />
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-10">
        <ExerciseLayout
          title="COACH VOCABULAIRE"
          badge="Coach Vocabulaire"
          badgeColor="emerald"
          description="Enrichissez votre lexique thématique pour le TEF IRN. Nous ciblons vos mots à réviser au bon moment pour une mémorisation durable."
        >
          <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 space-y-4 shadow-sm">
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <GraduationCap size={14} className="text-emerald-600" /> Thématiques
            </div>
            <div className="flex flex-wrap gap-2">
              {[...VOCAB_CATEGORIES, "Toutes"].map((cat) => (
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 space-y-4 shadow-sm">
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Target size={14} className="text-emerald-600" /> Choisir votre niveau
              </div>
              <div className="flex gap-2">
                {["A1", "A2", "B1", "B2"].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLevel(lvl)}
                    className={`flex-1 h-12 rounded-2xl font-black transition-all ${filters.level === lvl ? 'bg-emerald-600 text-white shadow-lg' : 'bg-zinc-50 text-zinc-400 hover:border-zinc-200'}`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div
                onClick={() => startTraining(false)}
                className="bg-zinc-900 p-6 rounded-[2rem] text-white space-y-2 shadow-sm relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform flex flex-col justify-center"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl" />
              <div className="text-[10px] font-black uppercase tracking-widest opacity-70 flex items-center gap-2">
                <GraduationCap size={14} /> Nouveaux mots
              </div>
              <h4 className="text-sm font-black leading-tight">Apprendre mes mots</h4>
              <p className="text-[11px] text-zinc-400 font-medium leading-snug">
                {loadingCatalogue
                  ? "Chargement…"
                  : `${Math.min(unmasteredCatalogueCount, 10)} mot${Math.min(unmasteredCatalogueCount, 10) > 1 ? "s" : ""} · ${filters.category === "Toutes" ? "Toutes thématiques" : filters.category} · Niveau ${filters.level}`}
              </p>
            </div>

            <div
                onClick={() => startTraining(true)}
                className="bg-emerald-600 p-6 rounded-[2rem] text-white space-y-2 shadow-sm relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform flex flex-col justify-center"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
              <div className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
                <Brain size={14} /> Flash révision
              </div>
              <h4 className="text-sm font-black leading-tight">Réviser mes mots</h4>
              <p className="text-[11px] text-emerald-100 font-medium leading-snug">
                {reviewDueCount === null
                  ? "Chargement…"
                  : `${Math.min(reviewDueCount, 10)} mot${Math.min(reviewDueCount, 10) > 1 ? "s" : ""} à réviser · ${filters.category === "Toutes" ? "Toutes thématiques" : filters.category} · Niveau ${filters.level}`}
              </p>
            </div>
          </div>

          <section className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                <Badge className="bg-emerald-600 rounded-full px-3 py-1 text-white border-none">Niveau {filters.level}</Badge>
                <span className="text-zinc-400">•</span>
                <span className="capitalize text-zinc-500">{filters.category}</span>
              </h2>
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                {catalogue.length} mot{catalogue.length > 1 ? 's' : ''} disponible{catalogue.length > 1 ? 's' : ''}
              </div>
            </div>

            {loadingCatalogue ? (
              <div className="bg-white rounded-[2rem] border border-zinc-100 divide-y divide-zinc-50 overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-zinc-100 animate-pulse" />
                ))}
              </div>
            ) : catalogueError ? (
              <Card className="border-dashed border-2 border-red-200 rounded-[2rem] p-12 text-center bg-red-50/50">
                <AlertTriangle className="mx-auto mb-4 text-red-300" size={40} />
                <p className="font-bold text-zinc-600 mb-4">Impossible de charger le vocabulaire. Vérifiez votre connexion.</p>
                <Button onClick={() => fetchCatalogue()} variant="outline" className="rounded-2xl font-bold">
                  Réessayer
                </Button>
              </Card>
            ) : catalogueGroups.length > 0 ? (
              // Accordéon strict (une seule thématique ouverte à la fois — comportement
              // par défaut de @base-ui/react/accordion, cf. CivicCatalogue.tsx). Toutes
              // les thématiques sont listées sur une seule page, repliées par défaut.
              // Scroll automatique vers le haut de la thématique qu'on vient d'ouvrir —
              // scroll-mt-24 compense ParcoursTopBar (sticky top-0, ~64px) si affichée.
              // Délai de 220ms (> 200ms, durée de l'animation CSS accordion-down/up dans
              // globals.css) : si une autre thématique était ouverte, elle continue de se
              // replier pendant l'ouverture de la nouvelle, décalant la cible tant que
              // l'animation n'est pas terminée.
              <Accordion
                className="space-y-3"
                onValueChange={(value: string[]) => {
                  const openedCategory = value[0];
                  if (catalogueScrollTimeoutRef.current) clearTimeout(catalogueScrollTimeoutRef.current);
                  if (!openedCategory) return;
                  const slug = openedCategory.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                  catalogueScrollTimeoutRef.current = setTimeout(() => {
                    document.getElementById(`vocab-category-${slug}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 220);
                }}
              >
                {catalogueGroups.map((group) => (
                  <AccordionItem
                    key={group.category}
                    value={group.category}
                    id={`vocab-category-${group.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                    className={`scroll-mt-24 rounded-[2rem] border shadow-sm px-6 border-b-0 transition-colors ${group.isFullyMastered ? completionCardStyles(true) : 'bg-white border-zinc-100'}`}
                  >
                    <AccordionTrigger className="hover:no-underline py-5">
                      <div className="flex items-center gap-3 text-left flex-1">
                        <span className="text-sm font-black uppercase tracking-tight text-zinc-900">{group.category}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                          {group.items.length} mot{group.items.length > 1 ? "s" : ""}
                        </span>
                        {group.isFullyMastered && <CompletionBadge />}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                      <VocabCatalogueTable items={group.items} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <Card className="border-dashed border-2 border-zinc-200 rounded-[2rem] p-12 text-center bg-white shadow-sm">
                <Target className="mx-auto mb-4 text-zinc-300" size={40} />
                <p className="font-bold text-zinc-500">Aucun mot trouvé pour cette sélection.</p>
              </Card>
            )}
          </section>
        </ExerciseLayout>
      </div>
    </div>
  );
}

export default function VocabCoach() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-zinc-50"><Loader2 className="animate-spin text-emerald-600" size={48} /></div>}>
      <VocabCoachContent />
    </Suspense>
  );
}
