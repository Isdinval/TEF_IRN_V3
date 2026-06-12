"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Parcours,
  Lesson,
  ParcoursProgress,
  UserParcoursProgress,
  ParcoursContextType
} from "@/types/parcours";
import {
  getParcoursById,
  getLessonsForParcours,
  getParcoursProgress
} from "@/lib/parcours";

const ParcoursContext = createContext<ParcoursContextType | undefined>(undefined);

export function ParcoursProvider({ children }: { children: React.ReactNode }) {
  const [activeParcours, setActiveParcours] = useState<Parcours | null>(null);
  const [progress, setProgress] = useState<ParcoursProgress | null>(null);
  const [userProgress, setUserProgress] = useState<UserParcoursProgress | null>(null);
  const [lessons, setLessons] = useState<(Lesson & { isCompleted: boolean })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const loadParcoursData = useCallback(async (parcoursId: string, userId: string) => {
    setIsLoading(true);
    try {
      const parcours = await getParcoursById(parcoursId);
      if (!parcours) return;

      // Fetch user specific progress from user_parcours_progress
      const { data: upData, error: upError } = await supabase
        .from('user_parcours_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('parcours_id', parcoursId)
        .single();

      // If no entry exists, create one (or just use local state for now if preferred)
      // For persistence, we should have an entry.
      let currentUP = upData;
      if (upError && upError.code === 'PGRST116') {
        const { data: newUP, error: createError } = await supabase
          .from('user_parcours_progress')
          .insert({
            user_id: userId,
            parcours_id: parcoursId,
            status: 'in_progress',
            progress_percentage: 0
          })
          .select()
          .single();
        if (!createError) currentUP = newUP;
      }

      // Fetch global progress and lessons
      const prog = await getParcoursProgress(userId, parcours.level, parcours.category);
      const allLessons = await getLessonsForParcours(parcours.level, parcours.category);

      // Fetch completed lessons
      const { data: completedData } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .in('lesson_id', allLessons.map((l: any) => l.id));

      const completedIds = new Set(completedData?.map((c: any) => c.lesson_id) || []);

      const lessonsWithStatus = allLessons.map((l: any) => ({
        ...l,
        isCompleted: completedIds.has(l.id)
      }));

      setActiveParcours(parcours);
      setProgress(prog);
      setUserProgress(currentUP);
      setLessons(lessonsWithStatus);

      // Update profiles.last_active_parcours_id
      await supabase
        .from('profiles')
        .update({ last_active_parcours_id: parcoursId })
        .eq('id', userId);

    } catch (error) {
      console.error("Error loading parcours context:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const parcoursIdFromUrl = searchParams.get('parcoursId');

      if (parcoursIdFromUrl) {
        await loadParcoursData(parcoursIdFromUrl, user.id);
      } else {
        // Try to load last active parcours from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('last_active_parcours_id')
          .eq('id', user.id)
          .single();

        if (profile?.last_active_parcours_id) {
          await loadParcoursData(profile.last_active_parcours_id, user.id);
        } else {
          setIsLoading(false);
        }
      }
    }
    init();
  }, [searchParams, loadParcoursData, supabase]);

  const activateParcours = async (parcoursId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await loadParcoursData(parcoursId, user.id);
  };

  const updateLessonProgress = async (lessonId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !activeParcours) return;

    // Refresh data
    await loadParcoursData(activeParcours.id, user.id);
  };

  const exitParcours = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ last_active_parcours_id: null })
        .eq('id', user.id);
    }
    setActiveParcours(null);
    setProgress(null);
    setUserProgress(null);
    setLessons([]);
  };

  const refreshProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && activeParcours) {
      await loadParcoursData(activeParcours.id, user.id);
    }
  };

  const currentLesson = lessons.find((l: any) => !l.isCompleted) || lessons[lessons.length - 1] || null;
  const nextLesson = lessons.find((l: any) => !l.isCompleted) || null;

  return (
    <ParcoursContext.Provider value={{
      activeParcours,
      progress,
      userProgress,
      isLoading,
      lessons,
      currentLesson,
      nextLesson,
      activateParcours,
      updateLessonProgress,
      exitParcours,
      refreshProgress
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
