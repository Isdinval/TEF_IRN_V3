"use client";

import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "section-today", label: "Aujourd'hui", activeClass: "bg-amber-500 text-white" },
  { id: "section-progress", label: "Ma progression", activeClass: "bg-violet-600 text-white" },
  { id: "section-analysis", label: "Analyse détaillée", activeClass: "bg-zinc-900 text-white" },
];

export function DashboardSectionNav() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id);

  useEffect(() => {
    const elements = SECTIONS
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    // Bande d'observation centrée juste sous la nav sticky : la section dont
    // le haut traverse cette bande devient "active". rootMargin négatif des
    // deux côtés pour ne considérer qu'une fine tranche proche du haut du
    // viewport plutôt que toute section simplement visible à l'écran.
    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries.filter((e) => e.isIntersecting);
        if (intersecting.length === 0) return;
        const topMost = intersecting.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b
        );
        setActiveId(topMost.target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="sticky top-4 z-20 mt-6 flex w-fit gap-2 rounded-full border border-zinc-100 bg-white/90 p-1.5 shadow-sm backdrop-blur">
      {SECTIONS.map((s) => (
        <button
          key={s.id}
          onClick={() => scrollToSection(s.id)}
          className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${
            activeId === s.id ? s.activeClass : "text-zinc-400 hover:text-zinc-700"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
