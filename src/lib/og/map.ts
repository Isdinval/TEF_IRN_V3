import type { OgSpec } from "./card";

/** Mapping lignes Supabase → carte de partage (fonctions pures, testées). */

/** « A2, B1, B2 » → « A2 → B2 » ; un seul niveau → « B1 » ; rien d'exploitable → null. */
export function levelBadge(level?: string | null): string | null {
  const ls = (level || "").toUpperCase().match(/[ABC][12]/g);
  if (!ls?.length) return null;
  return ls.length === 1 || ls[0] === ls[ls.length - 1] ? ls[0] : `${ls[0]} → ${ls[ls.length - 1]}`;
}

/** Mot-clé SEO sans annotations « (parcours) », « (estimé titre uniquement) » ; premier mot-clé d'une liste. */
export function cleanKeyword(kw?: string | null): string | null {
  const first = (kw || "").split(/","|",\s*"|,\s(?=[^,]*$)/)[0];
  const t = first.replace(/\([^)]*\)/g, "").replace(/^[\s"'[{]+|[\s"'\]}]+$/g, "").replace(/\s+/g, " ").trim();
  return t || null;
}

export type GuideRow = { title: string; level?: string | null; mot_cle_principal?: string | null };
export function guideSpec(product: "tef-irn" | "examen-civique", slug: string, g: GuideRow): OgSpec {
  const civic = product === "examen-civique";
  return { title: g.title, kicker: civic ? "EXAMEN CIVIQUE · GUIDE" : "TEF IRN · GUIDE", badge: levelBadge(g.level), keyword: cleanKeyword(g.mot_cle_principal), seed: `${product}/guides/${slug}`, civic };
}

/** Titre de leçon « Sujet au TEF IRN | long sous-titre… » : seule la partie avant « | » va sur l'image. */
export type LessonRow = { title: string; level?: string | null; mots_clefs_SEO?: unknown };
export function lessonSpec(slug: string, l: LessonRow): OgSpec {
  const kw = Array.isArray(l.mots_clefs_SEO) ? String(l.mots_clefs_SEO[0] ?? "") : typeof l.mots_clefs_SEO === "string" ? l.mots_clefs_SEO : null;
  return { title: l.title.split("|")[0].trim(), kicker: "TEF IRN · LEÇON", badge: levelBadge(l.level), keyword: cleanKeyword(kw), seed: `lessons/${slug}` };
}

export type ParcoursRow = { nom_parcours?: string | null; category?: string | null; level?: string | null };
export function parcoursSpec(slug: string, p: ParcoursRow): OgSpec {
  return { title: p.nom_parcours || `${p.category ?? "Parcours"} ${p.level ?? ""}`.trim(), kicker: "TEF IRN · PARCOURS", badge: levelBadge(p.level), seed: `parcours/${slug}` };
}
