"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { getParcoursById, getParcoursProgress, getLessonsForParcours } from "@/lib/parcours";
import { Parcours, ParcoursProgress, Lesson } from "@/types/parcours";

interface ActiveParcours extends Parcours {
  progress: ParcoursProgress;
  lessons: Lesson[];
  currentLessonId?: string;
  completedLessonIds: string[];
}

interface ParcoursContextType {
  activeParcours: ActiveParcours | null;
  loading: boolean;
  setActiveParcoursById: (id: string) => Promise<void>;
  updateProgress: () => Promise<void>;
  refreshActiveParcours: () => Promise<void>;
  getNextLesson: () => Lesson | null;
  goToNextLesson: () => void;
  quitParcours: () => void;
}

const ParcoursContext = createContext<ParcoursContextType | undefined>(undefined);

function ParcoursProviderContent({ children }: { children: React.ReactNode }) {
  const [activeParcours, setActiveParcours] = useState<ActiveParcours | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const loadParcoursData = useCallback(async (parcoursId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const parcours = await getParcoursById(parcoursId);
      if (!parcours) return;

      const lessons = await getLessonsForParcours(parcours.level, parcours.category);
      const progress = await getParcoursProgress(user.id, parcours.level, parcours.category);

      const lessonIds = lessons.map(l => l.id);
      const { data: completedData } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds);

      const completedLessonIds = completedData?.map((d: { lesson_id: string }) => d.lesson_id) || [];

      const { data: dbProgress } = await supabase
        .from('user_parcours_progress')
        .select('current_lesson_id')
        .eq('user_id', user.id)
        .eq('parcours_id', parcoursId)
        .maybeSingle();

      setActiveParcours({
        ...parcours,
        progress,
        lessons,
        completedLessonIds,
        currentLessonId: dbProgress?.current_lesson_id || undefined
      });

      localStorage.setItem("activeParcoursId", parcoursId);

      await supabase.from('user_parcours_progress').upsert({
        user_id: user.id,
        parcours_id: parcoursId,
        last_activity_at: new Date().toISOString(),
        status: progress.percent === 100 ? 'completed' : 'in_progress',
        progress_percentage: progress.percent
      }, { onConflict: 'user_id,parcours_id' });

    } catch (error) {
      console.error("Error loading parcours data:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    async function init() {
      const urlParcoursId = searchParams.get("parcoursId");
      const savedParcoursId = localStorage.getItem("activeParcoursId");

      if (urlParcoursId) {
        await loadParcoursData(urlParcoursId);
      } else if (savedParcoursId && !activeParcours) {
        const relevantPaths = ["/lessons", "/practice", "/vocab", "/grammar-check", "/parcours"];
        if (relevantPaths.some(p => pathname.startsWith(p))) {
           await loadParcoursData(savedParcoursId);
        } else {
           setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    init();
  }, [searchParams, pathname, loadParcoursData, activeParcours]);

  const setActiveParcoursById = async (id: string) => {
    setLoading(true);
    await loadParcoursData(id);
  };

  const updateProgress = async () => {
    if (!activeParcours) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const progress = await getParcoursProgress(user.id, activeParcours.level, activeParcours.category);

    const lessonIds = activeParcours.lessons.map(l => l.id);
    const { data: completedData } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .in('lesson_id', lessonIds);

    const completedLessonIds = completedData?.map((d: { lesson_id: string }) => d.lesson_id) || [];

    setActiveParcours(prev => prev ? { ...prev, progress, completedLessonIds } : null);

    await supabase.from('user_parcours_progress').update({
        progress_percentage: progress.percent,
        status: progress.percent === 100 ? 'completed' : 'in_progress',
        last_activity_at: new Date().toISOString()
    }).eq('user_id', user.id).eq('parcours_id', activeParcours.id);
  };

  const refreshActiveParcours = async () => {
    if (activeParcours) {
      await loadParcoursData(activeParcours.id);
    }
  };

  const getNextLesson = (): Lesson | null => {
    if (!activeParcours) return null;
    const next = activeParcours.lessons.find(l => !activeParcours.completedLessonIds.includes(l.id));
    return next || null;
  };

  const goToNextLesson = () => {
    const next = getNextLesson();
    if (next) {
      router.push(`/lessons/${next.id}?parcoursId=${activeParcours?.id}`);
    } else if (activeParcours) {
      router.push(`/parcours/${activeParcours.id}`);
    }
  };

  const quitParcours = () => {
    localStorage.removeItem("activeParcoursId");
    setActiveParcours(null);
    router.push("/parcours");
  };

  return (
    <ParcoursContext.Provider value={{
        activeParcours,
        loading,
        setActiveParcoursById,
        updateProgress,
        refreshActiveParcours,
        getNextLesson,
        goToNextLesson,
        quitParcours
    }}>
      {children}
    </ParcoursContext.Provider>
  );
}

export function ParcoursProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ParcoursProviderContent>{children}</ParcoursProviderContent>
    </Suspense>
  );
}

export function useParcours() {
  const context = useContext(ParcoursContext);
  if (context === undefined) {
    throw new Error("useParcours must be used within a ParcoursProvider");
  }
  return context;
}
