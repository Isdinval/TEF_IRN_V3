"use client";

import type { LucideIcon } from "lucide-react";

export interface CivicSection {
  id: string;
  label: string;
  icon: LucideIcon;
  activeClass: string;
}

interface CivicSectionNavProps {
  sections: CivicSection[];
  activeSection: string;
  onChange: (id: string) => void;
}

// Onglets contrôlés (même pattern que DashboardSectionNav côté TEF IRN) : une
// seule section est montée à la fois, ce composant est un pur sélecteur.
// Contrairement à TEF IRN, ici chaque onglet correspond à une seule action
// (pas un regroupement de plusieurs widgets), affichée "en grand" une fois
// sélectionnée -- d'où des icônes visibles à même l'onglet pour aider à
// identifier chaque action rapidement, y compris en scroll horizontal mobile.
export function CivicSectionNav({ sections, activeSection, onChange }: CivicSectionNavProps) {
  return (
    <div className="sticky top-4 z-20 flex gap-2 overflow-x-auto rounded-full border border-zinc-100 bg-white/90 p-1.5 shadow-sm backdrop-blur">
      {sections.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-black uppercase tracking-widest transition-all ${
            activeSection === s.id ? s.activeClass : "text-zinc-400 hover:text-zinc-700"
          }`}
        >
          <s.icon size={13} />
          {s.label}
        </button>
      ))}
    </div>
  );
}
