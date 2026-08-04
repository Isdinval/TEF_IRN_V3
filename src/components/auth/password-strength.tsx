"use client";

// Seuil minimum imposé par Supabase Auth (à garder synchronisé si la
// config du projet change : Dashboard > Auth > Policies > Minimum password length).
const MIN_LENGTH = 6;

function computeStrength(password: string): { score: number; label: string; color: string } {
  if (password.length === 0) {
    return { score: 0, label: "", color: "bg-zinc-200" };
  }
  if (password.length < MIN_LENGTH) {
    return { score: 1, label: `Trop court (min. ${MIN_LENGTH} caractères)`, color: "bg-red-500" };
  }

  let score = 1; // longueur minimale atteinte
  if (password.length >= 10) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ["", "Faible", "Moyen", "Fort", "Très fort"];
  const colors = ["bg-zinc-200", "bg-orange-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"];
  return { score, label: labels[score], color: colors[score] };
}

// Affiché uniquement là où on crée/choisit un nouveau mot de passe
// (inscription, réinitialisation) — jamais sur un champ de connexion.
export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const { score, label, color } = computeStrength(password);
  const segments = 4;

  return (
    <div className="space-y-1.5 mt-2" aria-live="polite">
      <div className="flex gap-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? color : "bg-zinc-100"}`}
          />
        ))}
      </div>
      <p className="text-[11px] font-bold text-zinc-500">{label}</p>
    </div>
  );
}
