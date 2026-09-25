#!/usr/bin/env node
// Garde-fou du design system (docs/product/design-system.md) :
// signale les classes interdites dans les lignes AJOUTÉES par rapport à une base
// (origin/main par défaut). Le code existant toléré n'est pas signalé.
// Usage : npm run design:check [-- <base>]
import { execSync } from "node:child_process";

const base = process.argv[2] ?? "origin/main";
const PATHS = ["src/app/tef-irn", "src/app/examen-civique", "src/components/shared"];
const RULES = [
  [/\b(?:slate|gray|violet|purple|rose|orange|blue|green)-\d{2,3}\b/, "couleur hors palette (§2.2)"],
  [/\bfont-(?:semibold|extrabold)\b/, "graisse interdite (§3.2)"],
  [/\brounded-\[/, "rayon arbitraire (§4.2)"],
  // Éditeur EE : max-md: toléré (design system §2.5).
  [/\bmax-md:/, "préfixe max-md: (§7.1)", ["src/app/tef-irn/writing/page.tsx", "src/app/tef-irn/writing/components/ZoneRedaction.tsx"]],
  [/\btext-\[(?:[0-9]|1[0-9])(?:\.\d+)?px\]/, "taille hors échelle : text-xs (12px) minimum, capitales et badges uniquement (§3.1)"],
  [/\btext-\[clamp/, "taille fluide hors échelle : utiliser text-* + md: (§3.1)"],
  [/>[A-ZÀ-ÖØ-Þ][A-ZÀ-ÖØ-Þ' ’!]{4,}</, "texte saisi en capitales : saisir normalement + classe uppercase (§3.3)"],
  [/"[A-ZÀ-ÖØ-Þ][A-ZÀ-ÖØ-Þ’ ]{7,}"/, "texte saisi en capitales : saisir normalement + classe uppercase (§3.3)"],
  [/\b100vh\b/, "100vh → 100dvh (§7.3)"],
];

const diff = execSync(`git diff -U0 ${base}...HEAD -- ${PATHS.join(" ")}`, { encoding: "utf8" });
const errors = [];
// Texte en casse normale : 14px minimum. text-xs (12px) seulement si la même chaîne de classes
// porte uppercase (micro-label, bouton) ou rounded-full (badge).
const smallLowercase = (l) =>
  (l.match(/"[^"]*"|'[^']*'|`[^`]*`/g) ?? []).some(
    (t) => /(?<![\w:-])text-xs\b/.test(t) && !/uppercase|rounded-full/.test(t)
  );
let file = "";
let line = 0;
for (const l of diff.split("\n")) {
  if (l.startsWith("+++ ")) file = l.slice(6);
  else if (l.startsWith("@@")) line = Number(/\+(\d+)/.exec(l)?.[1] ?? 0);
  else if (l.startsWith("+")) {
    for (const [re, msg, allowed = []] of RULES) if (re.test(l) && !allowed.includes(file)) errors.push(`${file}:${line}  ${msg}`);
    if (smallLowercase(l)) errors.push(`${file}:${line}  text-xs sur du texte en casse normale : text-sm minimum (§3.1)`);
    line++;
  }
}

if (errors.length) {
  console.error(`❌ ${errors.length} écart(s) au design system :\n${errors.join("\n")}`);
  process.exit(1);
}
console.log(`✅ Aucun écart au design system dans les lignes ajoutées depuis ${base}.`);
