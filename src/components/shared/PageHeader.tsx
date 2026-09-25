import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

/**
 * En-tête standard des pages applicatives : badge + titre + description.
 * Référence : docs/product/design-system.md §5. Ne jamais recoder ce motif à la main.
 * Pas de marge externe : l'espace sous l'en-tête (32 px) est fourni par la page (`gap-8` ou `mb-8`).
 */
interface PageHeaderProps {
  /** 1 à 3 mots, saisis normalement (la casse est gérée par le style). */
  badge: string;
  /** Début du titre, en zinc (texte, ou nœud déjà mis en forme). */
  title: ReactNode;
  /** Fin du titre, en indigo (exactement un segment, toujours à la fin). */
  highlight?: string;
  /** 1 à 2 phrases orientées action. */
  description?: ReactNode;
  /** Élément sous la description (ex. quota du jour). */
  children?: ReactNode;
  /** Élément à droite sur desktop, en dessous sur mobile (ex. badge « Session vocale »). */
  aside?: ReactNode;
}

export function PageHeader({ badge, title, highlight, description, children, aside }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div>
        <Badge className="mb-4 rounded-full border-none bg-indigo-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
          {badge}
        </Badge>
        <h1 className="mb-4 text-4xl font-black uppercase tracking-tighter text-zinc-900 md:text-5xl">
          {title}{highlight && <> <span className="text-indigo-600">{highlight}</span></>}
        </h1>
        {description && (
          <p className="max-w-2xl text-base font-medium leading-relaxed text-zinc-500 md:text-lg">{description}</p>
        )}
        {children}
      </div>
      {aside}
    </header>
  );
}
