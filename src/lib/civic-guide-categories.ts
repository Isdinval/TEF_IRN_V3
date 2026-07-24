// Isomorphe (client + serveur) — ne pas importer supabase-server ici.
// Voir civic-guides.ts pour le fetch serveur, qui importe ce fichier (et pas l'inverse).

export const CIVIC_GUIDE_CATEGORIES = [
  "examen-civique-general",
  "naturalisation-civique",
  "csp-civique",
  "cr-civique",
] as const;

export const CIVIC_GENERAL_GUIDE_CATEGORY = "examen-civique-general";

/** Catégorie de guide spécifique à une démarche (mention), pour le filtrage côté client. */
export function guideCategoryForMention(mention: string): string {
  switch (mention) {
    case "csp":
      return "csp-civique";
    case "cr":
      return "cr-civique";
    case "naturalisation":
    default:
      return "naturalisation-civique";
  }
}
