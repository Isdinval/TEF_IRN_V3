"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const MENTION_STORAGE_KEY = "civic_mention_v1";
const THEME_STORAGE_KEY = "civic_theme_v1";

export const DEFAULT_MENTION = "naturalisation";
export const DEFAULT_THEME = "Toutes";

/**
 * Source unique de vérité pour la démarche (mention) et la thématique choisies par
 * l'utilisateur, partagée entre le sommaire (/examen-civique) et les sous-pages
 * (/parcourir, /entrainement, /examen-blanc).
 *
 * Priorité de lecture : query params (lien direct, retour arrière) > localStorage
 * (visite précédente) > valeurs par défaut. `setMention`/`setTheme` écrivent les deux
 * pour que la sélection survive à un lien partagé comme à un retour ultérieur sur le site.
 */
export function useCivicContext() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const mention = useMemo(() => {
    const fromUrl = searchParams.get("mention");
    if (fromUrl) return fromUrl;
    if (typeof window !== "undefined") {
      return window.localStorage.getItem(MENTION_STORAGE_KEY) || DEFAULT_MENTION;
    }
    return DEFAULT_MENTION;
  }, [searchParams]);

  const theme = useMemo(() => {
    const fromUrl = searchParams.get("theme");
    if (fromUrl) return fromUrl;
    if (typeof window !== "undefined") {
      return window.localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
    }
    return DEFAULT_THEME;
  }, [searchParams]);

  const setMention = useCallback(
    (value: string) => {
      if (typeof window !== "undefined") window.localStorage.setItem(MENTION_STORAGE_KEY, value);
      const params = new URLSearchParams(searchParams.toString());
      params.set("mention", value);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setTheme = useCallback(
    (value: string) => {
      if (typeof window !== "undefined") window.localStorage.setItem(THEME_STORAGE_KEY, value);
      const params = new URLSearchParams(searchParams.toString());
      params.set("theme", value);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  /** Construit un lien vers une sous-page en conservant mention/theme courants. */
  const buildHref = useCallback(
    (path: string, extra?: Record<string, string>) => {
      const params = new URLSearchParams();
      params.set("mention", mention);
      if (theme !== DEFAULT_THEME) params.set("theme", theme);
      if (extra) Object.entries(extra).forEach(([k, v]) => params.set(k, v));
      return `${path}?${params.toString()}`;
    },
    [mention, theme]
  );

  return { mention, theme, setMention, setTheme, buildHref };
}
