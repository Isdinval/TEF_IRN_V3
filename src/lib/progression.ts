import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from './supabase';
import { getParcours, getParcoursProgress } from './parcours';

const defaultSupabase = createClient();

export const CECRL_LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;
export type CecrlLevel = typeof CECRL_LEVELS[number];

// Ordre pédagogique recommandé entre catégories d'un même niveau -- purement
// indicatif pour l'affichage. Aucun verrou n'existe aujourd'hui entre les
// parcours d'un même niveau (ils sont librement accessibles en parallèle,
// même en mode académique) : même principe que le non-gating décidé pour
// EE/EO/Examen blanc plus bas, on ne l'invente pas ici non plus.
const CATEGORY_ORDER = ['grammaire', 'conjugaison', 'syntaxe', 'vocabulaire'];

// Contraintes actuelles de la base (writing_exam_scenarios.level et
// oral_session_results.level : CHECK ... IN ('A2','B1','B2'), cf. migrations
// 20240520000022 et 20240520000021) -- A1 n'a aujourd'hui aucun contenu
// EE/EO/Examen. Confirmé par Olivier : à terme il y en aura pour chaque
// niveau, mais rien à afficher tant que le contenu n'existe pas.
const EE_EO_EXAM_LEVELS: CecrlLevel[] = ['A2', 'B1', 'B2'];

export interface ParcoursStepStatus {
  id: string;
  slug: string;
  category: string;
  completed: number;
  total: number;
  isCompleted: boolean;
}

export interface CheckpointStatus {
  done: boolean;
  href: string;
}

export interface LevelProgression {
  level: CecrlLevel;
  parcours: ParcoursStepStatus[];
  parcoursCompleted: boolean;
  /** null = pas encore de contenu à ce niveau (A1 aujourd'hui, cf. EE_EO_EXAM_LEVELS). */
  ee: CheckpointStatus | null;
  eo: CheckpointStatus | null;
  examBlanc: CheckpointStatus | null;
  isLevelComplete: boolean;
}

/**
 * exams.level est une plage texte libre ('A2-B1', 'B1', 'B1-B2' -- jamais
 * 'A1', cf. migration 20260720000010_exams_theme_columns.sql) plutôt qu'un
 * niveau CECRL unique : un examen "couvre" un niveau si ce niveau apparaît
 * dans la plage.
 */
function examCoversLevel(examLevel: string, level: CecrlLevel): boolean {
  return examLevel.split('-').includes(level);
}

/**
 * Progression macro par niveau CECRL (A1 à B2) : statut de chaque parcours
 * du niveau, puis des checkpoints EE / EO / Examen blanc une fois tous les
 * parcours terminés -- alimente la page /tef-irn/progression (accordéons).
 *
 * "Fait" pour EE/EO/Examen = au moins une tentative enregistrée à ce niveau
 * (writing_scenario_attempts / oral_session_results / exam_ce_co_attempts),
 * pas un score minimum -- même logique de checkpoint que le reste du
 * parcours guidé (voir aussi note "pas de gating dur" plus bas).
 */
export async function getLevelProgression(
  userId: string,
  supabase: SupabaseClient = defaultSupabase
): Promise<LevelProgression[]> {
  const [allParcours, examsResult] = await Promise.all([
    getParcours(supabase),
    supabase.from('exams').select('id, level'),
  ]);
  const exams = (examsResult.data || []) as { id: string; level: string | null }[];

  const results: LevelProgression[] = [];

  for (const level of CECRL_LEVELS) {
    const levelParcours = allParcours
      .filter((p) => p.level === level)
      .sort((a, b) => CATEGORY_ORDER.indexOf(a.category.toLowerCase()) - CATEGORY_ORDER.indexOf(b.category.toLowerCase()));

    const parcours: ParcoursStepStatus[] = await Promise.all(
      levelParcours.map(async (p): Promise<ParcoursStepStatus> => {
        const progress = await getParcoursProgress(userId, p.level, p.category, p.id, supabase);
        return {
          id: p.id,
          slug: p.slug,
          category: p.category,
          completed: progress.completed,
          total: progress.total,
          isCompleted: progress.isCompleted,
        };
      })
    );

    const parcoursCompleted = parcours.length > 0 && parcours.every((p) => p.isCompleted);

    let ee: CheckpointStatus | null = null;
    let eo: CheckpointStatus | null = null;
    let examBlanc: CheckpointStatus | null = null;

    if (EE_EO_EXAM_LEVELS.includes(level)) {
      const [eeResult, eoResult] = await Promise.all([
        supabase.from('writing_scenario_attempts').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('level', level),
        supabase.from('oral_session_results').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('level', level),
      ]);
      ee = { done: (eeResult.count || 0) > 0, href: '/tef-irn/writing' };
      eo = { done: (eoResult.count || 0) > 0, href: '/tef-irn/oral' };

      const matchingExamIds = exams.filter((e) => e.level && examCoversLevel(e.level, level)).map((e) => e.id);
      let examDone = false;
      if (matchingExamIds.length > 0) {
        const { data: examQuestions } = await supabase
          .from('exam_questions')
          .select('id')
          .in('exam_id', matchingExamIds);
        const questionIds = (examQuestions || []).map((q: { id: string }) => q.id);
        if (questionIds.length > 0) {
          const { count } = await supabase
            .from('exam_ce_co_attempts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .in('exam_question_id', questionIds);
          examDone = (count || 0) > 0;
        }
      }
      examBlanc = { done: examDone, href: '/tef-irn/exam' };
    }

    const isLevelComplete =
      parcoursCompleted &&
      (ee === null || ee.done) &&
      (eo === null || eo.done) &&
      (examBlanc === null || examBlanc.done);

    results.push({ level, parcours, parcoursCompleted, ee, eo, examBlanc, isLevelComplete });
  }

  return results;
}
