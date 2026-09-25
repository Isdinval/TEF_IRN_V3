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
  [/\bmax-md:/, "préfixe max-md: (§7.1)"],
  [/\b100vh\b/, "100vh → 100dvh (§7.3)"],
];

const diff = execSync(`git diff -U0 ${base}...HEAD -- ${PATHS.join(" ")}`, { encoding: "utf8" });
const errors = [];
let file = "";
let line = 0;
for (const l of diff.split("\n")) {
  if (l.startsWith("+++ ")) file = l.slice(6);
  else if (l.startsWith("@@")) line = Number(/\+(\d+)/.exec(l)?.[1] ?? 0);
  else if (l.startsWith("+")) {
    for (const [re, msg] of RULES) if (re.test(l)) errors.push(`${file}:${line}  ${msg}`);
    line++;
  }
}

if (errors.length) {
  console.error(`❌ ${errors.length} écart(s) au design system :\n${errors.join("\n")}`);
  process.exit(1);
}
console.log(`✅ Aucun écart au design system dans les lignes ajoutées depuis ${base}.`);
