import { BookOpen, BookText, Clock, Languages, ListTree, SpellCheck, type LucideIcon } from "lucide-react";

// Couleurs d'identification des catégories de leçon / d'exercice (design system §2.6).
// Source unique : une catégorie a la même couleur et la même icône partout.
// Emplacements autorisés : pastille d'icône, barre de carte, badge, puce de filtre.
// Jamais pour un bouton, un titre ou du texte courant (l'action reste indigo).
export interface CategoryIdentity {
  /** Couleur de bordure (à combiner avec border-t-4 / border-l-4). */
  border: string;
  /** Barre haute (avec border-t-4). */
  top: string;
  /** Barre latérale gauche (avec border-l-4). */
  bar: string;
  /** Fond pâle (pastille, badge). */
  soft: string;
  /** Texte sur fond pâle (contraste AA). */
  text: string;
  /** Puce de filtre. */
  dot: string;
  /** Pastille d'icône remplie au survol de la carte. */
  hoverIconBg: string;
  /** Badge de catégorie prêt à l'emploi. */
  badge: string;
  icon: LucideIcon;
}

export const CATEGORY_IDENTITY: Record<string, CategoryIdentity> = {
  grammaire: { border: "border-emerald-500", top: "border-t-emerald-500", bar: "border-l-emerald-500", soft: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", hoverIconBg: "group-hover:bg-emerald-600", badge: "bg-emerald-50 text-emerald-700", icon: BookText },
  conjugaison: { border: "border-blue-500", top: "border-t-blue-500", bar: "border-l-blue-500", soft: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", hoverIconBg: "group-hover:bg-blue-600", badge: "bg-blue-50 text-blue-700", icon: Clock },
  syntaxe: { border: "border-violet-500", top: "border-t-violet-500", bar: "border-l-violet-500", soft: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500", hoverIconBg: "group-hover:bg-violet-600", badge: "bg-violet-50 text-violet-700", icon: ListTree },
  vocabulaire: { border: "border-amber-500", top: "border-t-amber-500", bar: "border-l-amber-500", soft: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", hoverIconBg: "group-hover:bg-amber-600", badge: "bg-amber-50 text-amber-700", icon: Languages },
  orthographe: { border: "border-rose-500", top: "border-t-rose-500", bar: "border-l-rose-500", soft: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", hoverIconBg: "group-hover:bg-rose-600", badge: "bg-rose-50 text-rose-700", icon: SpellCheck },
  default: { border: "border-zinc-300", top: "border-t-zinc-300", bar: "border-l-zinc-300", soft: "bg-zinc-100", text: "text-zinc-600", dot: "bg-zinc-400", hoverIconBg: "group-hover:bg-zinc-600", badge: "bg-zinc-100 text-zinc-600", icon: BookOpen },
};

export function identityOf(category?: string | null): CategoryIdentity {
  return CATEGORY_IDENTITY[category?.toLowerCase() ?? ""] ?? CATEGORY_IDENTITY.default;
}
