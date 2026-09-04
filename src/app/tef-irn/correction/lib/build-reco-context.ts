import { ExerciseAttempt, WritingError } from "@/types/writing";
import { ResolveContext } from "@/lib/recommendation-resolver";
import { SupabaseClient } from "@supabase/supabase-js";

// Item 7 du plan "Refonte page Correction" : dériver un ResolveContext (même
// contrat que resolveNextExercises, déjà utilisé par /lessons/[slug]/complete,
// /practice, /parcours/[slug]) à partir des erreurs/points faibles d'UNE
// tentative précise -- pas de la leçon générique, contrairement aux appelants
// existants.
//
// Séparé du composant de rendu (même pattern que lib/estimate-level.ts, item 5)
// pour rester testable isolément.

const normalizeLevel = (level?: string | null): string | null => {
  // exams.level peut être composite ("A2-B1") pour un sujet d'examen blanc --
  // resolveNextExercises fait un .eq('level', ...) exact, jamais de forme
  // composite (même piège déjà documenté dans RecentCorrectionsList.tsx).
  if (!level) return null;
  return level.split('-')[0].trim() || null;
};

// EE : type_erreur ('grammaire'|'vocabulaire'|'orthographe'|'syntaxe'|
// 'conjugaison'|'improvement') correspond déjà 1:1 au domaine lessons.category
// (minuscule) -- pas de mapping à faire, contrairement à l'EO ci-dessous.
// 'improvement' exclu : ce n'est pas une erreur de fond, pas de leçon à
// recommander pour ça.
const buildEeContext = (attempt: ExerciseAttempt, level: string): ResolveContext | null => {
  const feedback = attempt.answers.feedback as any;
  const errors: WritingError[] = feedback?.liste_des_erreurs || [];
  const realErrors = errors.filter(e => e.type_erreur && e.type_erreur !== 'improvement');

  if (realErrors.length === 0) {
    // Tentative sans erreur de fond détectée : pas de notion précise à cibler,
    // on retombe sur des recommandations génériques par niveau plutôt que de
    // n'afficher aucune recommandation.
    return { level };
  }

  const categoryFrequency = new Map<string, number>();
  realErrors.forEach(e => categoryFrequency.set(e.type_erreur, (categoryFrequency.get(e.type_erreur) || 0) + 1));
  const topCategory = [...categoryFrequency.entries()].sort((a, b) => b[1] - a[1])[0][0];

  const tags = [...new Set(realErrors.map(e => e.sous_categorie).filter((t): t is string => !!t))].slice(0, 5);

  return { level, category: topCategory, tags: tags.length > 0 ? tags : undefined };
};

// EO : seuls les critères "correction_grammaticale" et
// "etendue_et_precision_du_vocabulaire" ont un équivalent direct dans le
// domaine lessons.category (grammaire/vocabulaire) -- les 3 autres critères
// officiels (pertinence, cohérence, aisance) n'ont pas de leçon écrite
// correspondante dans le référentiel actuel, donc pas de mapping possible ici.
const EO_SCORE_THRESHOLD = 70;

const buildEoContext = (attempt: ExerciseAttempt, level: string): ResolveContext | null => {
  const feedback = attempt.answers.feedback as any;
  const scores = feedback?.scores || {};

  const candidates: { category: string; score: number }[] = [
    { category: 'grammaire', score: scores.correction_grammaticale },
    { category: 'vocabulaire', score: scores.etendue_et_precision_du_vocabulaire },
  ].filter(c => typeof c.score === 'number' && c.score < EO_SCORE_THRESHOLD);

  if (candidates.length === 0) {
    // Aucun des 2 critères mappables n'est faible (ou EO globalement solide) :
    // recommandations génériques par niveau, même choix que l'EE ci-dessus.
    return { level };
  }

  const weakest = candidates.sort((a, b) => a.score - b.score)[0];
  return { level, category: weakest.category };
};

export function buildRecoContext(attempt: ExerciseAttempt): ResolveContext | null {
  const feedback = attempt.answers.feedback as any;
  const level = normalizeLevel(feedback?.level);
  if (!level) return null;

  return attempt.skill === "EO" ? buildEoContext(attempt, level) : buildEeContext(attempt, level);
}

// Bloc E de l'item 4 ("remontées LlamaKusi août 2026") : contexte de
// recommandation post-examen blanc (ResultsScreen). Les 4 épreuves (CE/CO/
// EE/EO) ont 4 formats de données de résultat différents (answers[] pour
// CE/CO, writingFeedbacks pour EE, oralAnalyses pour EO) -- plutôt que 4
// parseurs distincts, on s'appuie sur user_errors, déjà alimentée de façon
// uniforme par trackUserError() sur les 4 routes de complétion (vérifié :
// api/exam/ce-co-complete, api/writing/scenario-complete, api/oral/analyze
// l'appellent toutes). Même heuristique top-catégorie que buildEeContext
// ci-dessus, et même lecture de user_errors que get_dashboard_data()
// (v_weak_points) -- source de vérité déjà établie, pas un nouveau calcul.
export async function buildExamWeakPointsContext(
  userId: string,
  level: string,
  supabase: SupabaseClient
): Promise<ResolveContext | null> {
  const { data } = await supabase
    .from('user_errors')
    .select('category, sub_category, frequency, last_seen_at')
    .eq('user_id', userId)
    .order('frequency', { ascending: false })
    .order('last_seen_at', { ascending: false })
    .limit(5);

  if (!data || data.length === 0) return null;

  const topCategory = data[0].category;
  const tags = [...new Set(
    data
      .filter((e: any) => e.category === topCategory && e.sub_category)
      .map((e: any) => e.sub_category as string)
  )].slice(0, 5);

  return { level, category: topCategory, tags: tags.length > 0 ? tags : undefined };
}
