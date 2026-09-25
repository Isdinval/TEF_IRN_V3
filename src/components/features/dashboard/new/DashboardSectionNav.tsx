"use client";

export const DASHBOARD_SECTIONS = [
  { id: "today", label: "Aujourd'hui", activeClass: "bg-indigo-600 text-white" },
  { id: "progress", label: "Ma progression", activeClass: "bg-indigo-600 text-white" },
  { id: "analysis", label: "Analyse détaillée", activeClass: "bg-indigo-600 text-white" },
] as const;

export type DashboardSectionId = typeof DASHBOARD_SECTIONS[number]["id"];

interface DashboardSectionNavProps {
  activeSection: DashboardSectionId;
  onChange: (id: DashboardSectionId) => void;
}

// Onglets contrôlés : une seule section est montée à la fois côté page.tsx,
// ce composant est un pur sélecteur (pas de scroll, pas d'observer).
// Sur mobile, les 3 labels (uppercase + tracking-widest) dépassent souvent la
// largeur de l'écran : au lieu de laisser le conteneur "w-fit" pousser toute
// la page dans le débordement horizontal (bug trouvé en test réel), il
// défile lui-même horizontalement, contenu à l'intérieur de son propre cadre.
export function DashboardSectionNav({ activeSection, onChange }: DashboardSectionNavProps) {
  return (
    <div className="sticky top-4 z-20 mt-6 flex max-w-full gap-2 overflow-x-auto rounded-full border border-zinc-100 bg-white/90 p-1.5 shadow-sm backdrop-blur">
      {DASHBOARD_SECTIONS.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onChange(s.id)}
          aria-pressed={activeSection === s.id}
          className={`flex h-11 shrink-0 items-center rounded-full px-4 text-xs font-black uppercase tracking-widest transition-all ${
            activeSection === s.id ? s.activeClass : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
