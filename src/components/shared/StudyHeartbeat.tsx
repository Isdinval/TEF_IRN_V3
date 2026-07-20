"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase";

const HEARTBEAT_INTERVAL_MS = 60_000;

/**
 * Compte le "Temps d'étude" du dashboard sur la durée réelle de connexion
 * (1 minute créditée par tick), plutôt que sur la durée de chaque exercice
 * qui arrondit systématiquement à 0 pour un QCM rapide. Ne compte que si
 * l'onglet est visible pour éviter de créditer du temps en arrière-plan.
 */
export function StudyHeartbeat() {
  useEffect(() => {
    const supabase = createClient();

    const tick = () => {
      if (document.visibilityState !== "visible") return;
      supabase.rpc("increment_study_minutes").then((res: { error: unknown }) => {
        if (res.error) console.error("Study heartbeat error:", res.error);
      });
    };

    const interval = setInterval(tick, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return null;
}
