/**
 * Normalise un texte : passage en minuscules, suppression des accents et des espaces superflus.
 */
export function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Supprime les articles définis et indéfinis au début d'une chaîne en français.
 */
export function removeFrenchArticles(text: string): string {
  // Regex pour : le, la, les, l', un, une, des (avec ou sans espace après l')
  return text.replace(/^(le\s+|la\s+|les\s+|l'|un\s+|une\s+|des\s+)/i, "").trim();
}

/**
 * Valide une réponse de vocabulaire avec tolérance pour les accents, la casse et les articles.
 */
export function validateVocabResponse(userInput: string, expectedWord: string): {
  isValid: boolean;
  toleranceApplied: boolean;
  message?: string;
} {
  const cleanInput = normalizeText(userInput);
  const cleanExpected = normalizeText(expectedWord);

  // 1. Comparaison stricte (après normalisation de base)
  if (cleanInput === cleanExpected) {
    const isStrictMatch = userInput.trim() === expectedWord.trim();
    return {
      isValid: true,
      toleranceApplied: !isStrictMatch,
      message: !isStrictMatch ? "Réponse acceptée (accents/casse ignorés)" : undefined
    };
  }

  // 2. Comparaison sans les articles
  const inputNoArticle = removeFrenchArticles(cleanInput);
  const expectedNoArticle = removeFrenchArticles(cleanExpected);

  if (inputNoArticle === expectedNoArticle) {
    return {
      isValid: true,
      toleranceApplied: true,
      message: "Réponse acceptée (article ignoré)"
    };
  }

  // 3. Cas particulier : traits d'union et espaces insécables
  const simplify = (s: string) => s.replace(/[\s-]/g, "");
  if (simplify(cleanInput) === simplify(cleanExpected)) {
     return {
       isValid: true,
       toleranceApplied: true,
       message: "Réponse acceptée (ponctuation ignorée)"
     };
  }

  return { isValid: false, toleranceApplied: false };
}
