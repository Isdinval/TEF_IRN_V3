"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Parcours, Lesson, ParcoursProgress } from "@/types/parcours";
import { getParcoursById, getParcoursProgress, getLessonsForParcours } from "@/lib/parcours";

interface ParcoursContextType {
  activeParcours: Parcours | null;
  activeLesson: Lesson | null;
  progress: ParcoursProgress | null;
  isLoading: boolean;
  refreshProgress: () => Promise<void>;
  exitParcours: () => void;
  nextLesson: (currentLessonId?: string) => Promise<void>;
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

  const parcoursId = searchParams.get("parcoursId");
  const lessonId = searchParams.get("lessonId");

  const loadParcoursData = useCallback(async (pId: string, lId: string | null) => {
    setIsLoading(true);
    try {
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

      const prog = await getParcoursProgress(user.id, p.level, p.category);
      const lessons = await getLessonsForParcours(p.level, p.category);

      let currentLesson = null;
      if (lId) {
        currentLesson = lessons.find(l => l.id === lId) || null;
      }

      setActiveParcours(p);
      setProgress(prog);
      setActiveLesson(currentLesson);

      // Sync with DB
      await supabase.from('user_parcours_progress').upsert({
        user_id: user.id,
        parcours_id: pId,
        current_lesson_id: lId,
        last_activity_at: new Date().toISOString(),
        progress_percentage: prog.percent
      });

      await supabase.from('profiles').update({
        last_active_parcours_id: pId
      }).eq('id', user.id);

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

  const exitParcours = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("parcoursId");
    params.delete("lessonId");
    setActiveParcours(null);
    setActiveLesson(null);
    setProgress(null);
    router.push(`${pathname}?${params.toString()}`);
  };

  const nextLesson = async (currentLessonId?: string) => {
    if (!activeParcours) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const lessons = await getLessonsForParcours(activeParcours.level, activeParcours.category);

    // 1. Mark current as completed if we are coming from a lesson or practice
    const idToMark = currentLessonId || lessonId;
    if (idToMark) {
      await supabase.from('lesson_progress').upsert({
        user_id: user.id,
        lesson_id: idToMark,
        completed_at: new Date().toISOString()
      });
    }

    // 2. Fetch updated completion status
    const { data: completedData } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .in('lesson_id', lessons.map((l: any) => l.id));

    const completedIds = new Set((completedData || []).map((c: any) => c.lesson_id));

    // 3. Find the first uncompleted lesson AFTER the current one if possible, or any uncompleted
    const currentIndex = idToMark ? lessons.findIndex(l => l.id === idToMark) : -1;
    let next = null;

    if (currentIndex !== -1) {
      next = lessons.slice(currentIndex + 1).find(l => !completedIds.has(l.id));
    }

    if (!next) {
      next = lessons.find(l => !completedIds.has(l.id));
    }

    if (next) {
      router.push(`/tef-irn/lessons/${next.slug}?parcoursId=${activeParcours.id}`);
    } else {
      router.push(`/tef-irn/parcours/${activeParcours.slug}/complete`);
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
      nextLesson
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
