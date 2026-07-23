import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

export type AdminGuardState = "checking" | "denied" | "granted";

/**
 * Vérifie côté client si l'utilisateur connecté a profiles.is_admin = true.
 * Ceci est un contrôle de confort UX uniquement : la sécurité réelle est assurée
 * par les policies RLS (is_admin) sur les tables concernées et, pour les routes API,
 * par une vérification serveur équivalente.
 */
export function useAdminGuard(): AdminGuardState {
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState<AdminGuardState>("checking");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (active) setState("denied"); return; }
      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
      if (active) setState(profile?.is_admin ? "granted" : "denied");
    })();
    return () => { active = false; };
  }, [supabase]);

  return state;
}
