"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

const MIN_PCT = 30;
const MAX_PCT = 70;

/**
 * Gère la largeur (en %) de la colonne gauche d'un split 2 panneaux
 * redimensionnable par glisser-déposer (souris + tactile via Pointer Events).
 * `containerRef` doit être posé sur l'élément parent des 2 colonnes.
 */
export function useResizableSplit(defaultPct = 50) {
  const [leftPct, setLeftPct] = useState(defaultPct);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!draggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setLeftPct(Math.min(MAX_PCT, Math.max(MIN_PCT, pct)));
  }, []);

  const stopDragging = useCallback(() => {
    draggingRef.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", stopDragging);
  }, [handlePointerMove]);

  const onDragStart = useCallback(
    (e: ReactPointerEvent) => {
      e.preventDefault();
      draggingRef.current = true;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", stopDragging);
    },
    [handlePointerMove, stopDragging]
  );

  // Nettoyage si le composant démonte pendant un drag en cours.
  useEffect(() => stopDragging, [stopDragging]);

  return { leftPct, containerRef, onDragStart };
}
