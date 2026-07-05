"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export interface ExerciseFilters {
  level: string;
  category: string;
}

export function useExerciseFilters(initialLevel = "A2", initialCategory = "Toutes") {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<ExerciseFilters>(() => ({
    level: searchParams.get('level') || initialLevel,
    category: searchParams.get('category') || initialCategory,
  }));

  const updateFilters = useCallback((newFilters: Partial<ExerciseFilters>) => {
    setFilters((prev) => {
      const updated = { ...prev, ...newFilters };

      if (updated.level === prev.level && updated.category === prev.category) {
        return prev;
      }

      const params = new URLSearchParams(window.location.search);
      if (updated.level) params.set('level', updated.level);
      if (updated.category) params.set('category', updated.category);

      const newUrl = `${pathname}?${params.toString()}`;
      // Use router.replace but avoid loop if already on that URL
      if (typeof window !== 'undefined' && window.location.pathname + window.location.search !== newUrl) {
          router.replace(newUrl, { scroll: false });
      }

      return updated;
    });
  }, [pathname, router]);

  // Sync state with URL params if they change externally
  useEffect(() => {
    const level = searchParams.get('level');
    const category = searchParams.get('category');

    if (level || category) {
      setFilters((prev) => {
        const nextLevel = level || prev.level;
        const nextCategory = category || prev.category;
        if (prev.level === nextLevel && prev.category === nextCategory) return prev;
        return { level: nextLevel, category: nextCategory };
      });
    }
  }, [searchParams]);

  return {
    filters,
    updateFilters,
    setLevel: useCallback((level: string) => updateFilters({ level }), [updateFilters]),
    setCategory: useCallback((category: string) => updateFilters({ category }), [updateFilters]),
  };
}
