// ============================================================================
// Personas illustratifs — partagés entre la landing (Testimonials) et la page
// login (carousel de témoignages).
//
// ⚠️ Ce sont des profils-types fictifs, pas de vrais retours clients. Ne
// jamais y ajouter de score TEF IRN chiffré ni de note (étoiles) : ce sont
// des allégations vérifiables qui doivent être réservées à de vrais
// témoignages avec consentement explicite.
//
// Pour ajouter un persona : compléter cet objet, il sera automatiquement
// disponible sur la landing et (si level !== "A2") dans le carousel login.
// ============================================================================

export type PersonaLevel = "A2" | "B1" | "B2";
export type PersonaIcon = "file" | "clock" | "mic" | "layers";
export type PersonaAccent = "blue" | "purple" | "amber" | "emerald";

export interface Persona {
  id: string;
  flag: string;
  name: string;
  role: string;
  level: PersonaLevel;
  image: string;
  /** Citation "besoin", utilisée sur la landing (section Testimonials). */
  landingText: string;
  /** Libellé court du besoin, utilisée sur la landing. */
  landingNeed: string;
  /** Citation "résultat", sans score chiffré, utilisée dans le carousel login. */
  loginQuote: string;
  icon: PersonaIcon;
  accent: PersonaAccent;
}

export const PERSONAS: Persona[] = [
  {
    id: "maria",
    flag: "pe",
    name: "Maria",
    role: "Ingénieure informatique à Lyon · Naturalisation B2",
    level: "B2",
    image:
      "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/landing_page/Maria_Ingenieur_informatique_Lyon.webp",
    landingText:
      "Je comprends tout ce qu'on me dit au travail, mais quand il faut écrire une lettre officielle ou parler à quelqu'un que je ne connais pas… je bloque complètement.",
    landingNeed: "Coach à l'écrit et à l'oral, dans un registre formel",
    loginQuote:
      "Le coach m'a appris à structurer mes lettres officielles et à parler avec assurance à l'oral. Mon dossier de naturalisation est déposé.",
    icon: "file",
    accent: "blue",
  },
  {
    id: "ahmed",
    flag: "ma",
    name: "Ahmed",
    role: "Chef d'équipe BTP à Nantes · Carte de résident B1",
    level: "B1",
    image:
      "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/landing_page/Ahmed_Chef_Equipe_BTP_Nantes.webp",
    landingText:
      "J'ai pas le temps d'aller à des cours le soir. Il me faut quelque chose que je peux faire sur mon téléphone, à mon rythme.",
    landingNeed: "Disponible le soir, entre 21h et 23h",
    loginQuote:
      "Je m'entraînais sur mon téléphone entre 21h et 23h, à mon rythme. Mon niveau B1 est validé, ma carte de résident en cours.",
    icon: "clock",
    accent: "purple",
  },
  {
    id: "fatou",
    flag: "sn",
    name: "Fatou",
    role: "Assistante administrative en mairie à Bordeaux · Naturalisation B2",
    level: "B2",
    image:
      "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/landing_page/Fatou_Assistante_Administrative_Mairie_Bordeaux.webp",
    landingText:
      "J'ai besoin de quelqu'un qui me corrige vraiment, pas juste qui me dise ce qui est faux.",
    landingNeed: "Correction écrite détaillée, pas juste un score",
    loginQuote:
      "La correction ligne par ligne de mes écrits m'a fait vraiment progresser, pas juste corriger mes fautes. Mon niveau B2 est validé.",
    icon: "mic",
    accent: "amber",
  },
  {
    id: "karim",
    flag: "dz",
    name: "Karim",
    role: "Comptable à Toulouse · Naturalisation B2",
    level: "B2",
    image:
      "https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/landing_page/Karim_comptable_Toulouse.webp",
    landingText:
      "Je devais réussir l'Examen Civique et le TEF IRN la même année. Avoir les deux parcours au même endroit m'a fait gagner un temps fou.",
    landingNeed: "Un seul coach pour l'Examen Civique et le TEF IRN",
    loginQuote:
      "Avoir le TEF IRN et l'Examen Civique au même endroit m'a fait gagner un temps fou. Les deux sont validés, mon dossier est complet.",
    icon: "layers",
    accent: "emerald",
  },
];
