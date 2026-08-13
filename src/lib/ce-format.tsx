import React from 'react';

// Repère les lacunes numérotées dans un texte à trous CE, ex: "___________ (1)".
// Format retenu (cf. docs/tef-irn-reference.md) : underscores suivis du numéro entre parenthèses.
const GAP_REGEX = /_{2,}\s*\((\d+)\)/g;

/**
 * Découpe un texte à trous en morceaux de texte brut et de pastilles de lacune.
 * La lacune correspondant à `activeGap` (highlightGap de la question en cours) est
 * mise en évidence ; les autres lacunes du même texte partagé restent visibles mais neutres.
 */
export function renderClozeText(texte: string, activeGap?: number): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(GAP_REGEX);
  let key = 0;

  while ((match = regex.exec(texte)) !== null) {
    if (match.index > lastIndex) {
      parts.push(texte.slice(lastIndex, match.index));
    }
    const gapNumber = parseInt(match[1], 10);
    const isActive = gapNumber === activeGap;
    parts.push(
      <span
        key={`gap-${key++}`}
        className={`inline-flex items-center justify-center min-w-[2.25rem] px-2 py-0.5 mx-0.5 rounded-lg text-sm font-black align-middle ${
          isActive
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'bg-zinc-200 text-zinc-400'
        }`}
      >
        ({gapNumber})
      </span>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < texte.length) {
    parts.push(texte.slice(lastIndex));
  }

  return parts;
}
