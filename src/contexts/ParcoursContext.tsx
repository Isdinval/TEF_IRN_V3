"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Parcours, Lesson, ParcoursProgress } from "@/types/parcours";
import { getParcoursById, getParcoursProgress, getLessonsForParcours, getExerciseUrl } from "@/lib/parcours";
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
  nextExercise: () => Promise<void>;
  nextVocabulary: () => Promise<void>;
  /** true après un appel à nextVocabulary() qui n'a trouvé aucun mot non
   *  maîtrisé au niveau du parcours actif -- jamais réinitialisé vers un
   *  niveau supérieur automatiquement (item 9 du plan "Navigation continue
   *  /parcours/[slug]"). Consommé par la TopBar (item 8) pour afficher un
   *  état "niveau maîtrisé" plutôt qu'une navigation. */
  vocabFullyMastered: boolean;
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
  }, [supabase]);

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

  // Filet de sécurité : la progress bar de la TopBar doit toujours refléter
  // l'état réel, même quand une navigation ne change ni parcoursId ni lessonId
  // (ex: complétion d'un exercice depuis /lessons/[slug]/complete).
  useEffect(() => {
    if (activeParcours) {
      refreshProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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

  // Bouton "Exercice suivant" de la TopBar. Réutilise resolveNextExercises()
  // (moteur de recommandation déjà appelé côté navigateur dans practice/page.tsx
  // et grammar-check/page.tsx -- aucune nouvelle technique introduite), avec la
  // même leçon de contexte que nextLesson() ci-dessus pour rester cohérent avec
  // ce que l'utilisateur est en train de suivre dans le parcours.
  //
  // Item 9 : ouverture en nouvel onglet uniquement si on est actuellement sur
  // le hub /tef-irn/parcours/[slug] (même besoin que les cartes de la page --
  // garder le hub ouvert) ; navigation classique (même onglet) partout
  // ailleurs, comme nextLesson().
  const nextExercise = async () => {
    if (!activeParcours) return;

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

    const [exercise] = await resolveNextExercises(
      user.id,
      {
        level: activeParcours.level,
        category: activeParcours.category,
        lessonId: contextLesson?.id,
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
      vocabFullyMastered
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
