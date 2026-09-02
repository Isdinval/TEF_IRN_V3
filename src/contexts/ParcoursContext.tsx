"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Parcours, Lesson, ParcoursProgress } from "@/types/parcours";
import { getParcoursById, getParcoursProgress, getLessonsForParcours, getExerciseUrl, getUnlockedLessonIds, getRemainingExerciseCounts, RemainingExerciseCounts } from "@/lib/parcours";
import { resolveNextExercises } from "@/lib/recommendation-resolver";
import { resolveNextVocabTheme } from "@/lib/vocab/next-theme";

interface ParcoursContextType {
  activeParcours: Parcours | null;
  activeLesson: Lesson | null;
  progress: ParcoursProgress | null;
  isLoading: boolean;
  refreshProgress: () => Promise<void>;
  exitParcours: () => Promise<void>;
  nextLesson: () => Promise<void>;
  /** Item #5 du plan "Verrouillage exercices topbar/parcours" : le type est
   *  désormais obligatoire (qcm -> /practice, trous -> /grammar-check, cf.
   *  getExerciseUrl() dans lib/parcours.ts), un seul bouton "Exercice"
   *  agrégeant les deux formats ne permettait pas à l'utilisateur de choisir
   *  le type d'entraînement -- voir Option 1 du plan (deux boutons TopBar). */
  nextExercise: (type: 'qcm' | 'trous') => Promise<void>;
  nextVocabulary: () => Promise<void>;
  /** true après un appel à nextVocabulary() qui n'a trouvé aucun mot non
   *  maîtrisé au niveau du parcours actif -- jamais réinitialisé vers un
   *  niveau supérieur automatiquement (item 9 du plan "Navigation continue
   *  /parcours/[slug]"). Consommé par la TopBar (item 8) pour afficher un
   *  état "niveau maîtrisé" plutôt qu'une navigation. */
  vocabFullyMastered: boolean;
  /** Nombre d'exercices qcm/trous encore à faire parmi les leçons débloquées
   *  du parcours actif (item #4 du plan "Verrouillage exercices topbar/parcours") --
   *  null tant que non encore calculé (chargement initial). Consommé par la
   *  TopBar pour afficher un compteur sur chacun des deux boutons d'exercice. */
  exerciseCounts: RemainingExerciseCounts | null;
}

const ParcoursContext = createContext<ParcoursContextType | undefined>(undefined);

export function ParcoursProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [activeParcours, setActiveParcours] = useState<Parcours | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<ParcoursProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vocabFullyMastered, setVocabFullyMastered] = useState(false);
  const [exerciseCounts, setExerciseCounts] = useState<RemainingExerciseCounts | null>(null);

  // Cache court-terme : quand nextLesson() vient de recalculer parcours/progression/
  // leçons juste avant de naviguer, on évite de tout re-télécharger depuis zéro dans
  // loadParcoursData() sur la page de destination (même Provider, pas de remontage
  // entre deux navigations client-side). Consommé une seule fois puis vidé.
  const freshDataRef = useRef<{
    parcoursId: string;
    userId: string;
    parcours: Parcours;
    progress: ParcoursProgress;
    lessons: Lesson[];
  } | null>(null);

  const parcoursId = searchParams.get("parcoursId");
  const lessonId = searchParams.get("lessonId");

  // Calcule et pose les compteurs d'exercices restants (qcm/trous) sur les
  // leçons débloquées -- factorisé ici car appelé depuis 3 points : les deux
  // branches de loadParcoursData() (chargement initial) et refreshExerciseCounts()
  // (filet de sécurité pathname, même principe que refreshProgress()). Non
  // bloquant par nature (fire-and-forget côté appelants) : un léger délai
  // d'affichage du compteur est acceptable, contrairement au reste du chargement.
  const applyExerciseCounts = useCallback(async (
    userId: string,
    level: string,
    category: string,
    lessons: Lesson[],
    completedLessons: string[]
  ) => {
    const unlocked = getUnlockedLessonIds(lessons, completedLessons);
    const counts = await getRemainingExerciseCounts(userId, level, category, unlocked, supabase);
    setExerciseCounts(counts);
  }, [supabase]);

  const loadParcoursData = useCallback(async (pId: string, lId: string | null) => {
    setIsLoading(true);
    try {
      // Chemin rapide : données déjà fraîches, calculées juste avant la navigation
      // par nextLesson(). On évite 4 aller-retours Supabase redondants.
      const cached = freshDataRef.current;
      if (cached && cached.parcoursId === pId) {
        freshDataRef.current = null;

        const currentLesson = lId ? cached.lessons.find(l => l.id === lId) || null : null;
        setActiveParcours(cached.parcours);
        setProgress(cached.progress);
        setActiveLesson(currentLesson);
        setIsLoading(false);

        // Fire-and-forget comme les 2 syncs DB ci-dessous -- ne conditionne aucun rendu bloquant.
        applyExerciseCounts(cached.userId, cached.parcours.level, cached.parcours.category, cached.lessons, cached.progress.completedLessons);

        // Sync with DB en arrière-plan — n'a pas besoin de bloquer l'affichage,
        // ces écritures ne conditionnent aucun rendu.
        (async () => {
          const { error } = await supabase.from('user_parcours_progress').upsert({
            user_id: cached.userId,
            parcours_id: pId,
            current_lesson_id: lId,
            last_activity_at: new Date().toISOString(),
            progress_percentage: cached.progress.percent
          }, { onConflict: 'user_id,parcours_id' });
          if (error) console.error("Error syncing user_parcours_progress:", error);
        })();
        (async () => {
          const { error } = await supabase.from('profiles').update({
            last_active_parcours_id: pId
          }).eq('id', cached.userId);
          if (error) console.error("Error syncing profile:", error);
        })();

        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const p = await getParcoursById(pId);
      if (!p) {
        setIsLoading(false);
        return;
      }

      const [prog, lessons] = await Promise.all([
        getParcoursProgress(user.id, p.level, p.category),
        getLessonsForParcours(p.level, p.category),
      ]);

      let currentLesson = null;
      if (lId) {
        currentLesson = lessons.find(l => l.id === lId) || null;
      }

      setActiveParcours(p);
      setProgress(prog);
      setActiveLesson(currentLesson);

      // Fire-and-forget, même principe que le chemin rapide ci-dessus.
      applyExerciseCounts(user.id, p.level, p.category, lessons, prog.completedLessons);

      // Sync with DB — les deux écritures sont indépendantes (tables différentes),
      // exécutées en parallèle plutôt qu'en série.
      await Promise.all([
        supabase.from('user_parcours_progress').upsert({
          user_id: user.id,
          parcours_id: pId,
          current_lesson_id: lId,
          last_activity_at: new Date().toISOString(),
          progress_percentage: prog.percent
        }, { onConflict: 'user_id,parcours_id' }),
        supabase.from('profiles').update({
          last_active_parcours_id: pId
        }).eq('id', user.id),
      ]);

    } catch (error) {
      console.error("Error loading parcours context:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, applyExerciseCounts]);

  useEffect(() => {
    if (parcoursId) {
      loadParcoursData(parcoursId, lessonId);
    } else {
      const loadLastActive = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('last_active_parcours_id')
          .eq('id', user.id)
          .single();

        if (profile?.last_active_parcours_id && !pathname.includes('/parcours') && !pathname.includes('/login') && !pathname.includes('/onboarding')) {
          const currentParams = new URLSearchParams(searchParams.toString());
          currentParams.set("parcoursId", profile.last_active_parcours_id);
          router.replace(`${pathname}?${currentParams.toString()}`);
        } else {
          setActiveParcours(null);
          setActiveLesson(null);
          setProgress(null);
          setIsLoading(false);
        }
      };
      loadLastActive();
    }
  }, [parcoursId, lessonId, loadParcoursData, pathname, router, searchParams, supabase.auth]);

  const refreshProgress = async () => {
    if (!activeParcours) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const prog = await getParcoursProgress(user.id, activeParcours.level, activeParcours.category);
    setProgress(prog);
  };

  // Même principe que refreshProgress() ci-dessus, filet de sécurité pour le
  // compteur d'exercices restants (item #4) : re-fetch complet (lessons +
  // progress) plutôt que de dépendre d'un state local potentiellement obsolète.
  const refreshExerciseCounts = async () => {
    if (!activeParcours) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [lessons, prog] = await Promise.all([
      getLessonsForParcours(activeParcours.level, activeParcours.category),
      getParcoursProgress(user.id, activeParcours.level, activeParcours.category)
    ]);
    applyExerciseCounts(user.id, activeParcours.level, activeParcours.category, lessons, prog.completedLessons);
  };

  // Filet de sécurité : la progress bar de la TopBar doit toujours refléter
  // l'état réel, même quand une navigation ne change ni parcoursId ni lessonId
  // (ex: complétion d'un exercice depuis /lessons/[slug]/complete).
  useEffect(() => {
    if (activeParcours) {
      refreshProgress();
      refreshExerciseCounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // vocabFullyMastered est spécifique au parcours actif (niveau + thèmes de
  // ses leçons) -- le réinitialiser en changeant de parcours évite d'afficher
  // à tort "niveau maîtrisé" sur un nouveau parcours jamais testé.
  useEffect(() => {
    setVocabFullyMastered(false);
  }, [activeParcours?.id]);

  const exitParcours = async () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("parcoursId");
    params.delete("lessonId");
    setActiveParcours(null);
    setActiveLesson(null);
    setProgress(null);

    // Persist the exit, otherwise the auto-resume effect below brings the
    // parcours (and the TopBar) right back on the next navigation.
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ last_active_parcours_id: null }).eq('id', user.id);
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  // Cascade partagée par nextLesson() et nextExercise() pour déterminer la
  // leçon "de contexte" à partir de laquelle continuer : la leçon courante si
  // pas encore complétée, sinon la première leçon non complétée après elle,
  // sinon la première leçon non complétée du parcours. Extrait ici pour ne
  // pas dupliquer les 3 mêmes paliers dans les deux fonctions.
  const resolveContextLesson = (
    lessons: Lesson[],
    completedIds: Set<string>,
    currentLesson: Lesson | undefined
  ): Lesson | undefined => {
    let target = currentLesson && !completedIds.has(currentLesson.id) ? currentLesson : undefined;

    if (!target) {
      const currentIndex = currentLesson ? lessons.findIndex(l => l.id === currentLesson.id) : -1;
      target = currentIndex !== -1
        ? lessons.slice(currentIndex + 1).find(l => !completedIds.has(l.id))
        : undefined;
    }

    if (!target) {
      target = lessons.find(l => !completedIds.has(l.id));
    }

    return target;
  };

  const nextLesson = async () => {
    if (!activeParcours) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Navigation pure : on ne marque plus rien comme complété ici.
    // La complétion réelle est gérée par LessonInteractive (score >= 50%).
    const [lessons, freshProgress] = await Promise.all([
      getLessonsForParcours(activeParcours.level, activeParcours.category),
      getParcoursProgress(user.id, activeParcours.level, activeParcours.category)
    ]);
    setProgress(freshProgress);

    const completedIds = new Set(freshProgress.completedLessons);

    // La leçon "courante" est déduite de l'URL (/tef-irn/lessons/[slug]),
    // pas d'un lessonId query param (qui n'est jamais renseigné dans l'app).
    const currentSlug = pathname?.match(/^\/tef-irn\/lessons\/([^/]+)$/)?.[1];
    const currentLesson = currentSlug ? lessons.find(l => l.slug === currentSlug) : undefined;

    const target = resolveContextLesson(lessons, completedIds, currentLesson);

    if (target) {
      freshDataRef.current = {
        parcoursId: activeParcours.id,
        userId: user.id,
        parcours: activeParcours,
        progress: freshProgress,
        lessons,
      };
      router.push(`/tef-irn/lessons/${target.slug}?parcoursId=${activeParcours.id}`);
    } else {
      router.push(`/tef-irn/parcours/${activeParcours.slug}/complete`);
    }
  };

  // Boutons "QCM" / "Chasse aux erreurs" de la TopBar. Réutilise resolveNextExercises()
  // (moteur de recommandation déjà appelé côté navigateur dans practice/page.tsx
  // et grammar-check/page.tsx -- aucune nouvelle technique introduite), avec la
  // même leçon de contexte que nextLesson() ci-dessus pour rester cohérent avec
  // ce que l'utilisateur est en train de suivre dans le parcours.
  //
  // Item #5 (plan "Verrouillage exercices topbar/parcours") : type devient un
  // paramètre obligatoire -- l'ancien bouton unique "Exercice" agrégeait qcm et
  // trous indifféremment (getExerciseUrl() renvoie pourtant deux pages bien
  // distinctes selon le type : qcm -> /practice, trous -> /grammar-check),
  // l'utilisateur ne pouvait pas choisir son format d'entraînement.
  //
  // Item 9 : ouverture en nouvel onglet uniquement si on est actuellement sur
  // le hub /tef-irn/parcours/[slug] (même besoin que les cartes de la page --
  // garder le hub ouvert) ; navigation classique (même onglet) partout
  // ailleurs, comme nextLesson().
  const nextExercise = async (type: 'qcm' | 'trous') => {
    if (!activeParcours) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [lessons, freshProgress] = await Promise.all([
      getLessonsForParcours(activeParcours.level, activeParcours.category),
      getParcoursProgress(user.id, activeParcours.level, activeParcours.category)
    ]);

    const completedIds = new Set(freshProgress.completedLessons);
    // Contexte de recommandation = dernière leçon TERMINÉE, pas resolveContextLesson()
    // (qui cible la prochaine leçon À FAIRE -- correct pour nextLesson()/nextVocabulary()
    // qui naviguent vers la suite du parcours, mais pas pour une recommandation
    // d'exercices : proposer des exos liés à une leçon pas encore lue est incohérent.
    // Même correctif que /parcours/[slug]/page.tsx#currentLessonId.
    const contextLesson = [...lessons].reverse().find(l => completedIds.has(l.id));

    const [exercise] = await resolveNextExercises(
      user.id,
      {
        level: activeParcours.level,
        category: activeParcours.category,
        lessonId: contextLesson?.id,
        type,
        unlockedLessonIds: getUnlockedLessonIds(lessons, freshProgress.completedLessons),
      },
      supabase,
      1
    );

    if (!exercise) return;

    const url = getExerciseUrl(exercise, activeParcours.id);
    const isOnHub = pathname === `/tef-irn/parcours/${activeParcours.slug}`;

    if (isOnHub) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      router.push(url);
    }
  };

  // Bouton "Vocabulaire suivant" de la TopBar -- affiché uniquement pour un
  // parcours category='vocabulaire' (voir item 7, garde côté UI). Système SRS
  // structurellement séparé de resolveNextExercises() (voir docs/vocabulaire-
  // particularites-recommandation.md) : la résolution du thème passe par
  // resolveNextVocabTheme() (lib/vocab/next-theme.ts), jamais par le moteur
  // d'exercices.
  //
  // Contrainte non négociable (item 6 du plan) : ne jamais escalader
  // automatiquement vers le niveau CECRL suivant quand le niveau du parcours
  // est entièrement maîtrisé -- resolveNextVocabTheme() est appelée avec
  // activeParcours.level uniquement, jamais avec un niveau supérieur.
  const nextVocabulary = async () => {
    if (!activeParcours || activeParcours.category !== "vocabulaire") return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [lessons, freshProgress] = await Promise.all([
      getLessonsForParcours(activeParcours.level, activeParcours.category),
      getParcoursProgress(user.id, activeParcours.level, activeParcours.category)
    ]);

    const completedIds = new Set(freshProgress.completedLessons);
    const currentSlug = pathname?.match(/^\/tef-irn\/lessons\/([^/]+)$/)?.[1];
    const currentLesson = currentSlug ? lessons.find(l => l.slug === currentSlug) : undefined;
    const contextLesson = resolveContextLesson(lessons, completedIds, currentLesson);

    // Ordre de recherche : leçon de contexte d'abord, puis les leçons
    // suivantes du parcours dans l'ordre -- jamais un niveau différent.
    const startIndex = contextLesson ? lessons.findIndex(l => l.id === contextLesson.id) : 0;
    const orderedLessons = startIndex > 0
      ? [...lessons.slice(startIndex), ...lessons.slice(0, startIndex)]
      : lessons;

    const target = await resolveNextVocabTheme(supabase, user.id, activeParcours.level, orderedLessons);

    if (!target) {
      setVocabFullyMastered(true);
      return;
    }

    setVocabFullyMastered(false);

    const url = `/tef-irn/vocab?lessonId=${encodeURIComponent(target.lessonId)}&topic=${encodeURIComponent(target.theme)}&level=${encodeURIComponent(activeParcours.level)}`;
    const isOnHub = pathname === `/tef-irn/parcours/${activeParcours.slug}`;

    if (isOnHub) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      router.push(url);
    }
  };

  return (
    <ParcoursContext.Provider value={{
      activeParcours,
      activeLesson,
      progress,
      isLoading,
      refreshProgress,
      exitParcours,
      nextLesson,
      nextExercise,
      nextVocabulary,
      vocabFullyMastered,
      exerciseCounts
    }}>
      {children}
    </ParcoursContext.Provider>
  );
}

export function useParcours() {
  const context = useContext(ParcoursContext);
  if (context === undefined) {
    throw new Error("useParcours must be used within a ParcoursProvider");
  }
  return context;
}
