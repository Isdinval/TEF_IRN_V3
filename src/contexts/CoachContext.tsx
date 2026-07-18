"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

// Un type discriminé par page — volontairement plat, pas de contenu long (pas de markdown de leçon).
export type CoachPageContext =
  | {
      type: "lesson";
      title: string;
      level: string;
      category: string;
      difficulty?: string;
      objective?: string;
    }
  | {
      type: "parcours";
      category: string;
      level: string;
      objective?: string;
      progress?: { completed: number; total: number; percent: number };
      nextExercise?: { type: string; instructions: string } | null;
    }
  | {
      type: "writing";
      instructions: string;
      level: string;
    }
  | {
      type: "guide";
      title: string;
      level?: string;
      category?: string;
      description?: string;
    }
  | {
      type: "browsing";
      section: "lessons" | "guides";
    }
  | {
      type: "oral";
      title: string;
      sujet: string;
      objectifs: string[];
      level: string;
    };

interface CoachContextType {
  pageContext: CoachPageContext | null;
  setPageContext: (context: CoachPageContext | null) => void;
}

const CoachContext = createContext<CoachContextType | undefined>(undefined);

export function CoachProvider({ children }: { children: React.ReactNode }) {
  const [pageContext, setPageContextState] = useState<CoachPageContext | null>(null);

  // Stable identity pour éviter de redéclencher les useEffect des pages qui l'appellent.
  const setPageContext = useCallback((context: CoachPageContext | null) => {
    setPageContextState(context);
  }, []);

  return (
    <CoachContext.Provider value={{ pageContext, setPageContext }}>
      {children}
    </CoachContext.Provider>
  );
}

export function useCoachContext() {
  const context = useContext(CoachContext);
  if (context === undefined) {
    throw new Error("useCoachContext must be used within a CoachProvider");
  }
  return context;
}
