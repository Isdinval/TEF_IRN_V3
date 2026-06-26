"use client";

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export interface ExerciseFilters {
  level: string;
  category: string;
}

export function useExerciseFilters(initialLevel = "A2", initialCategory = "Toutes") {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<ExerciseFilters>({
    level: searchParams.get('level') || initialLevel,
    category: searchParams.get('category') || initialCategory,
  });

  const updateFilters = useCallback((newFilters: Partial<ExerciseFilters>) => {
    setFilters((prev) => {
      const updated = { ...prev, ...newFilters };

      const params = new URLSearchParams(searchParams.toString());
      if (updated.level) params.set('level', updated.level);
      if (updated.category) params.set('category', updated.category);

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      return updated;
    });
  }, [pathname, router, searchParams]);

  // Sync state with URL params if they change externally (e.g. browser back/forward)
  useEffect(() => {
    const level = searchParams.get('level');
    const category = searchParams.get('category');

    if (level || category) {
      setFilters((prev) => ({
        level: level || prev.level,
        category: category || prev.category,
      }));
    }
  }, [searchParams]);

  return {
    filters,
    updateFilters,
    setLevel: (level: string) => updateFilters({ level }),
    setCategory: (category: string) => updateFilters({ category }),
  };
}
