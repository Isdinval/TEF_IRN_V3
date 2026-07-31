"use client";

export const DASHBOARD_SECTIONS = [
  { id: "today", label: "Aujourd'hui", activeClass: "bg-amber-500 text-white" },
  { id: "progress", label: "Ma progression", activeClass: "bg-violet-600 text-white" },
  { id: "analysis", label: "Analyse détaillée", activeClass: "bg-zinc-900 text-white" },
] as const;

export type DashboardSectionId = typeof DASHBOARD_SECTIONS[number]["id"];

interface DashboardSectionNavProps {
  activeSection: DashboardSectionId;
  onChange: (id: DashboardSectionId) => void;
}

// Onglets contrôlés : une seule section est montée à la fois côté page.tsx,
// ce composant est un pur sélecteur (pas de scroll, pas d'observer).
export function DashboardSectionNav({ activeSection, onChange }: DashboardSectionNavProps) {
  return (
    <div className="sticky top-4 z-20 mt-6 flex w-fit gap-2 rounded-full border border-zinc-100 bg-white/90 p-1.5 shadow-sm backdrop-blur">
      {DASHBOARD_SECTIONS.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${
            activeSection === s.id ? s.activeClass : "text-zinc-400 hover:text-zinc-700"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
