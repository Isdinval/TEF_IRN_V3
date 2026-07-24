"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/components/providers/AuthProvider";

/**
 * true si l'utilisateur doit voir le pont vers LlamaKusi/TEF IRN : anonyme, connecté sans
 * abonnement, ou abonnement "free". Centralise un fetch autrement dupliqué sur le sommaire,
 * l'entraînement et l'examen blanc.
 */
export function useShowCivicTefBridge(): boolean {
  const { user } = useAuth();
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setSubscriptionTier(null); return; }
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single()
      .then(({ data }: { data: { subscription_tier: string } | null }) => {
        if (data) setSubscriptionTier(data.subscription_tier);
      });
  }, [user]);

  return !user || subscriptionTier === "free" || subscriptionTier === null;
}
