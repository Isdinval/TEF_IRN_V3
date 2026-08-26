"use client";

const LEVELS = ["A1", "A2", "B1", "B2"] as const;

interface VocabLevelSwitcherProps {
  currentLevel: string;
  onSelectLevel: (level: string) => void;
  /** Style compact (badges nus) vs. carte pleine (avec label "Autres niveaux
   *  disponibles"). "inline" pour le header du mode entraînement, "card"
   *  pour l'écran de fin de session. */
  variant?: "inline" | "card";
  className?: string;
}

/**
 * Sélecteur de niveau réutilisable pour rester sur le même thème vocabulaire
 * (filters.category inchangé) tout en changeant de niveau CECRL. Les 12
 * thématiques de VOCAB_CATEGORIES ont toutes leurs 4 niveaux remplis en base
 * (vérifié live, 48/48 cases) -- pas de logique de "disponibilité" à
 * calculer, les 4 niveaux sont toujours affichables.
 */
export default function VocabLevelSwitcher({ currentLevel, onSelectLevel, variant = "inline", className = "" }: VocabLevelSwitcherProps) {
  if (variant === "card") {
    return (
      <div className={`space-y-2 ${className}`}>
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Autres niveaux pour ce thème</p>
        <div className="flex gap-2">
          {LEVELS.filter((lvl) => lvl !== currentLevel).map((lvl) => (
            <button
              key={lvl}
              onClick={() => onSelectLevel(lvl)}
              className="flex-1 h-10 rounded-xl bg-zinc-50 text-zinc-600 font-black text-sm hover:bg-emerald-50 hover:text-emerald-700 transition-all"
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 bg-white border border-zinc-100 rounded-2xl p-1 shadow-sm ${className}`}>
      {LEVELS.map((lvl) => (
        <button
          key={lvl}
          onClick={() => onSelectLevel(lvl)}
          disabled={lvl === currentLevel}
          className={`w-10 h-9 rounded-xl font-black text-xs transition-all ${
            lvl === currentLevel
              ? "bg-emerald-600 text-white shadow-md cursor-default"
              : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700"
          }`}
        >
          {lvl}
        </button>
      ))}
    </div>
  );
}
