// ============================================================================
// Images illustratives pour la page /tef-irn/grammar-check
// Même convention que src/data/notre-histoire-images.ts : URLs hébergées sur
// Supabase Storage, à remplacer une fois les fichiers uploadés.
//
// IMPORTANT — format attendu :
// - VICTORY_MASCOT_URLS / PERPLEXED_MASCOT_URLS : PNG ou WEBP **fond
//   transparent** (détouré). Contrairement à notre-histoire, ces poses sont
//   affichées sur des fonds colorés (carte blanche, mais aussi potentiellement
//   un badge/accent indigo) — un fond blanc opaque ferait un carré visible.
// - CATALOGUE_WATERCOLOR_URL : PNG/WEBP fond blanc classique, format carré
//   (~1024x1024 source), pas besoin de détourage (posé sur une carte blanche).
// ============================================================================

// TODO(Olivier): remplacer par les 6 URLs Supabase/CDN des poses "victorieuses"
// détourées (fond transparent), découpées depuis llamakusi_character_sheet_lama_victorieux.png
// Grille source 1024x1024, 3 colonnes x 2 lignes, cases de 341x512px :
//   (0,0) (341,0) (683,0)
//   (0,512) (341,512) (683,512)
export const VICTORY_MASCOT_URLS: string[] = [
  "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/grammar-check/victorieux_1_transparent.webp",
  "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/grammar-check/victorieux_2_transparent.webp",
  "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/grammar-check/victorieux_3_transparent.webp",
  "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/grammar-check/victorieux_4_transparent.webp",
  "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/grammar-check/victorieux_5_transparent.webp",
  "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/grammar-check/victorieux_6_transparent.webp",
];

// TODO(Olivier): remplacer par les 6 URLs Supabase/CDN des poses "perplexes"
// détourées (fond transparent), découpées depuis llamakusi_character_sheet_lama_perplexe.png
// Même grille source que ci-dessus.
export const PERPLEXED_MASCOT_URLS: string[] = [
  "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/grammar-check/perplexe_1_transparent.webp",
  "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/grammar-check/perplexe_2_transparent.webp",
  "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/grammar-check/perplexe_3_transparent.webp",
  "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/grammar-check/perplexe_4_transparent.webp",
  "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/grammar-check/perplexe_5_transparent.webp",
  "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/grammar-check/perplexe_6_transparent.webp",
];

// TODO(Olivier): remplacer par l'URL Supabase/CDN de l'aquarelle carrée
// (fondateurs + llama en train de corriger un texte à table)
export const CATALOGUE_WATERCOLOR_URL =
  "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/grammar-check/aquarelle-catalogue.webp";

/** Tire une image au hasard dans un tableau (fallback sur le premier élément si vide). */
export function pickRandomImage(urls: string[]): string {
  if (!urls.length) return "";
  return urls[Math.floor(Math.random() * urls.length)];
}
