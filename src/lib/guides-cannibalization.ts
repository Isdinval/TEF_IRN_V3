import type { GuideProduct } from "@/types/guides";

// Detection de cannibalisation SEO : plusieurs guides publies visant le meme mot_cle_principal
// se disputent le meme classement Google au lieu de se completer. `mot_cle_principal` existe
// deja specifiquement pour ca (voir le libelle de l'ecart "missing_mot_cle" dans
// guides-health-score.ts) - ce module se contente de grouper par valeur normalisee et de
// signaler les groupes de 2+. Volontairement une correspondance EXACTE (apres normalisation
// espaces/casse) : une detection floue (similarite de titre, stemming) est un chantier a part,
// avec son lot de faux positifs a calibrer - hors scope de cette premiere passe.

export interface CannibalizationGuideRef {
  id: string;
  slug: string;
  title: string;
  product: GuideProduct;
}

export interface CannibalizationGroup {
  keyword: string;
  guides: CannibalizationGuideRef[];
}

function normalizeKeyword(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

export interface GuideForCannibalization extends CannibalizationGuideRef {
  mot_cle_principal: string | null;
}

/** Groupe les guides par mot_cle_principal normalise, ne retourne que les groupes de 2+. Trie
 * par taille de groupe decroissante (le cas le plus urgent en premier). */
export function detectCannibalization(guides: GuideForCannibalization[]): CannibalizationGroup[] {
  const byKeyword = new Map<string, CannibalizationGuideRef[]>();
  for (const g of guides) {
    if (!g.mot_cle_principal) continue;
    const normalized = normalizeKeyword(g.mot_cle_principal);
    if (!normalized) continue;
    const bucket = byKeyword.get(normalized) ?? [];
    bucket.push({ id: g.id, slug: g.slug, title: g.title, product: g.product });
    byKeyword.set(normalized, bucket);
  }

  return [...byKeyword.entries()]
    .filter(([, guidesForKeyword]) => guidesForKeyword.length >= 2)
    .map(([keyword, guidesForKeyword]) => ({ keyword, guides: guidesForKeyword }))
    .sort((a, b) => b.guides.length - a.guides.length);
}
