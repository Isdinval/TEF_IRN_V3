import { SupabaseClient } from "@supabase/supabase-js";
import { Lesson } from "@/lib/parcours";

export interface NextVocabTarget {
  lessonId: string;
  theme: string;
}

/**
 * Résout la prochaine thématique de vocabulaire non maîtrisée à réviser, en
 * parcourant orderedLessons dans l'ordre fourni par l'appelant (leçon de
 * contexte du parcours d'abord, cf. ParcoursContext.nextVocabulary()).
 *
 * Ne considère JAMAIS un niveau différent de `level` -- le vocabulaire est un
 * système SRS indépendant par niveau (VocabLevelSwitcher traite les 4 niveaux
 * comme des pools indépendants, aucune logique de progression automatique
 * entre eux), conformément à la séparation structurelle documentée dans
 * docs/vocabulaire-particularites-recommandation.md.
 *
 * Seuil de maîtrise identique au reste du produit : consecutive_correct >= 2
 * (même seuil que vocab/page.tsx et civic-local-store.ts).
 *
 * Retourne null si tous les thèmes couverts par orderedLessons sont
 * entièrement maîtrisés à ce niveau -- l'appelant doit alors afficher un état
 * "niveau maîtrisé" plutôt que de proposer un niveau supérieur.
 */
export async function resolveNextVocabTheme(
  supabase: SupabaseClient,
  userId: string,
  level: string,
  orderedLessons: Pick<Lesson, "id" | "vocab_theme_categories">[]
): Promise<NextVocabTarget | null> {
  // 1. Paires (lessonId, thème) à tester, sans doublon de thème -- une même
  //    thématique peut couvrir plusieurs leçons, on ne la re-teste pas deux
  //    fois : le premier match (dans l'ordre des leçons) suffit.
  const candidates: { lessonId: string; theme: string }[] = [];
  const seenThemes = new Set<string>();
  for (const lesson of orderedLessons) {
    for (const theme of lesson.vocab_theme_categories || []) {
      if (seenThemes.has(theme)) continue;
      seenThemes.add(theme);
      candidates.push({ lessonId: lesson.id, theme });
    }
  }

  if (candidates.length === 0) return null;

  // 2. Un seul aller-retour Supabase pour tous les mots des thèmes candidats à
  //    ce niveau, plutôt qu'une requête par thème -- même pattern que
  //    fetchCatalogue() dans vocab/page.tsx.
  const { data: words } = await supabase
    .from("vocabulary")
    .select("id, category")
    .eq("level", level)
    .in("category", candidates.map((c) => c.theme));

  if (!words || words.length === 0) return null;

  const { data: reviews } = await supabase
    .from("user_vocabulary_reviews")
    .select("vocab_id, consecutive_correct")
    .eq("user_id", userId)
    .in("vocab_id", words.map((w: { id: string }) => w.id));

  const masteredIds = new Set(
    (reviews || [])
      .filter((r: { consecutive_correct: number | null }) => (r.consecutive_correct || 0) >= 2)
      .map((r: { vocab_id: string }) => r.vocab_id)
  );

  // 3. Premier thème candidat (dans l'ordre des leçons) ayant au moins un mot
  //    non maîtrisé à ce niveau.
  for (const candidate of candidates) {
    const themeWordIds = words
      .filter((w: { category: string }) => w.category === candidate.theme)
      .map((w: { id: string }) => w.id);
    if (themeWordIds.length === 0) continue; // thème sans mots en base à ce niveau
    const hasUnmastered = themeWordIds.some((id: string) => !masteredIds.has(id));
    if (hasUnmastered) {
      return { lessonId: candidate.lessonId, theme: candidate.theme };
    }
  }

  return null;
}
