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
      slug: string;
      nomParcours?: string;
      objective?: string;
      progress?: { completed: number; total: number; percent: number };
      nextExercise?: {
        id: string;
        type: string;
        category: string;
        level: string;
        instructions: string;
        lessonId?: string;
        lessonTitle?: string;
        lessonSlug?: string;
      } | null;
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
    }
  | {
      type: "dashboard";
      currentLevel: string;
      goalLevel?: string;
      targetExamDate?: string | null;
      // Libellés courts (sub_category ou category) des points faibles les plus fréquents -- pas l'objet complet.
      weakPoints?: string[];
      inProgressParcoursCount: number;
    }
  | {
      type: "exercise";
      exerciseType: "qcm" | "trous";
      category: string;
      level: string;
      instructions?: string;
      currentIndex: number;
      totalQuestions: number;
      // Contenu réel affiché à l'écran -- sans ça le coach ne peut pas aider sur
      // "cette question", seulement parler de la catégorie/niveau en général.
      questionText?: string;
      options?: string[];
      correctAnswer?: string;
    }
  | {
      type: "vocab";
      word: string;
      category: string;
      level: string;
      currentIndex: number;
      totalCards: number;
      isReviewMode: boolean;
    }
  | {
      type: "progression";
      currentLevel: string;
      // Résumé compact par niveau CECRL (A1-B2) -- pas le détail des steps.
      levelsSummary: { level: string; completedSteps: number; totalSteps: number; isLevelComplete: boolean }[];
    }
  | {
      type: "civic";
      // Produit distinct du TEF IRN (naturalisation/CSP/CR) -- un seul type flexible plutôt
      // qu'une variante par sous-page, vu le nombre de pages et leur interactivité limitée.
      page: "training" | "eligibility" | "hub";
      mention?: string | null;
      theme?: string;
      currentIndex?: number;
      totalQuestions?: number;
      step?: number;
      totalSteps?: number;
      dueCount?: number;
      masteredCount?: number;
      bestScore?: number | null;
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
