import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { trackUserError, analyzeUserErrorsAndRecommend } from '@/lib/recommendation-engine';
import type { WritingFeedback } from '@/types/writing';

// Route dédiée aux sujets du catalogue "examen blanc" (table writing_exam_scenarios),
// séparée de /api/exercise-complete pour ne PAS violer la FK exercise_attempts.exercise_id
// -> exercises.id (voir docs/EXAM_SCENARIOS_CATALOGUE.md : les deux pools ne se mélangent jamais).
//
// Contrairement à /api/exercise-complete : pas de XP/streak, pas de SRS (updateSRS), pas de
// lien à une leçon. Un examen blanc reste "à la demande", non spacé.
// En revanche, les erreurs détectées (type_erreur) alimentent quand même user_errors, pour que
// les points faibles vus en examen blanc influencent les recommandations de drills du parcours.

// Aligné sur la casse déjà utilisée dans exercises.category / user_errors.category
// ("Conjugaison", "Grammaire", ...) pour ne pas créer de doublons de catégorie.
const CATEGORY_LABELS: Record<string, string> = {
  conjugaison: 'Conjugaison',
  grammaire: 'Grammaire',
  orthographe: 'Orthographe',
  syntaxe: 'Syntaxe',
  vocabulaire: 'Vocabulaire',
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { scenarioId, examQuestionId, section, level, text, feedback, studyTimeMinutes, context } = await req.json();

    const aiFeedback = feedback as WritingFeedback | undefined;

    if (!text || !aiFeedback) {
      return NextResponse.json({ error: 'Texte ou feedback manquant' }, { status: 400 });
    }

    // 'standalone' par défaut : couvre la page Rédaction (pratique libre) et tout appelant
    // qui ne précise pas encore ce champ. 'exam' est réservé aux tentatives EE passées dans
    // le cadre d'un examen blanc complet (/tef-irn/exam), voir item 5 du plan dashboard.
    const attemptContext = context === 'exam' ? 'exam' : 'standalone';

    // 1. Enregistrer la tentative (table dédiée, pas de FK vers exercises)
    const { error: attemptError } = await supabase
      .from('writing_scenario_attempts')
      .insert({
        user_id: user.id,
        scenario_id: scenarioId || null,
        // Rempli uniquement pour context='exam' : la question EE d'un examen blanc vient du
        // catalogue exam_questions, distinct de writing_exam_scenarios (scenario_id ci-dessus).
        exam_question_id: examQuestionId || null,
        section: section || null,
        level: level || null,
        submitted_text: text,
        overall_score: aiFeedback.score_global,
        scores: aiFeedback.scores_par_competence,
        errors: aiFeedback.liste_des_erreurs,
        general_comment: aiFeedback.conseil_general,
        corrected_text: aiFeedback.texte_corrige_complet,
        study_time_minutes: studyTimeMinutes || 0,
        context: attemptContext,
      });

    if (attemptError) throw attemptError;

    // 2. Remonter les types d'erreurs détectés vers user_errors (une seule fois par type
    // présent dans cette tentative, pas par occurrence, pour ne pas gonfler artificiellement
    // la fréquence quand une même règle est enfreinte plusieurs fois dans un seul texte).
    try {
      // Dédoublonnage par paire (catégorie, sous-catégorie) plutôt que par catégorie
      // seule (item 10.12) : deux erreurs "grammaire" mais de sous-catégories
      // différentes (ex. comparatifs / accord des adjectifs) doivent remonter
      // séparément, sinon la deuxième perdrait sa précision.
      const erreursDetectees = new Map<string, { category: string; subCategory: string | null }>();
      for (const e of aiFeedback.liste_des_erreurs || []) {
        const category = CATEGORY_LABELS[e.type_erreur];
        if (!category) continue;
        const subCategory = e.sous_categorie ?? null;
        erreursDetectees.set(`${category}|${subCategory ?? ''}`, { category, subCategory });
      }

      const sourceLabel = attemptContext === 'exam' ? 'Examen blanc' : 'Écrit';

      for (const { category, subCategory } of erreursDetectees.values()) {
        await trackUserError(user.id, category, subCategory, sourceLabel);
      }

      // Note : on ne résout PAS les erreurs absentes de ce texte (pas de resolveUserError ici).
      // Un texte libre qui n'utilise pas, par ex., de subordonnée ne prouve pas que la syntaxe
      // est maîtrisée -- contrairement à un exercice fermé qui teste spécifiquement un point.
    } catch (errorTrackingError) {
      console.error('Error tracking failed (writing scenario):', errorTrackingError);
    }

    // 3. Déclencher le moteur de recommandation avec ces nouveaux points faibles
    try {
      await analyzeUserErrorsAndRecommend(user.id);
    } catch (recoError) {
      console.error('Recommendation engine error (writing scenario):', recoError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Writing scenario complete API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
