"use client";

import { useEffect, useState } from "react";

/**
 * Retourne true si le media query correspond, côté client uniquement.
 * Défaut à `false` pendant le SSR/premier rendu pour éviter tout mismatch
 * d'hydratation ; se met à jour juste après le montage puis à chaque
 * changement de taille de fenêtre franchissant le seuil.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
