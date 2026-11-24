import { createClient } from "@supabase/supabase-js";
import type { OgSpec } from "./card";
import { guideSpec, lessonSpec, parcoursSpec } from "./map";

/** Données des images de partage. Client anonyme SANS cookies (lecture publique, comme le sitemap) : les images restent cachables. */
function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}

export const FALLBACK: OgSpec = { title: "Réussis ton TEF IRN et ton examen civique", kicker: "TEF IRN · EXAMEN CIVIQUE", seed: "llamakusi" };

export async function getGuideOg(product: "tef-irn" | "examen-civique", slug: string): Promise<OgSpec> {
  try {
    const { data } = await db().from("guides").select("title, level, mot_cle_principal, product").eq("slug", slug).maybeSingle();
    return data && (data.product ?? "tef-irn") === product ? guideSpec(product, slug, data) : FALLBACK;
  } catch { return FALLBACK; }
}

export async function getLessonOg(slug: string): Promise<OgSpec> {
  try {
    const { data } = await db().from("lessons").select("title, level, mots_clefs_SEO").eq("slug", slug).maybeSingle();
    return data ? lessonSpec(slug, data) : FALLBACK;
  } catch { return FALLBACK; }
}

export async function getParcoursOg(slug: string): Promise<OgSpec> {
  try {
    const { data } = await db().from("parcours").select("nom_parcours, category, level").eq("slug", slug).maybeSingle();
    return data ? parcoursSpec(slug, data) : FALLBACK;
  } catch { return FALLBACK; }
}

export async function getCentresOg(): Promise<OgSpec> {
  let count = 248;                       // repli si la requête échoue
  try {
    const r = await db().from("centres_examen_civique").select("*", { count: "exact", head: true }).eq("actif", true);
    if (r.count) count = r.count;
  } catch { /* repli */ }
  return { title: `${count} centres d'examen civique agréés`, kicker: "EXAMEN CIVIQUE · CENTRES", keyword: String(count), seed: "examen-civique/centres", civic: true };
}
