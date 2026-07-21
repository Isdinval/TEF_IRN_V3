// ============================================================================
// Images pour la page /tef-irn/login
// Même convention que src/data/grammar-check-images.ts : URLs hébergées sur
// Supabase Storage (bucket "login").
//
// IMPORTANT — format attendu pour LOGIN_WATERCOLOR_URLS :
// - Aquarelles pleine page, ratio 4:5 portrait, 1600x2000px, .webp, <350Ko.
// - Éviter les détails importants dans le tiers central (texte + carte
//   témoignage superposés par-dessus en absolute).
// - Nommage bucket : login_1.webp, login_2.webp, ... (ajouter simplement une
//   ligne ici à chaque nouvel upload, aucun autre changement de code requis).
// ============================================================================

// TODO(Olivier): compléter au fur et à mesure des uploads dans le bucket "login"
export const LOGIN_WATERCOLOR_URLS: string[] = [
  "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/login/login_1.webp",
  "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/login/login_2.webp",
  "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/login/login_3.webp",
  "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/login/login_4.webp",
];

// Logo Google officiel (SVG 4 couleurs) pour le bouton "Continuer avec Google".
export const GOOGLE_LOGO_URL =
  "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/login/chrome_logo.svg";
