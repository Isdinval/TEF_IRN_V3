import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from './supabase';
import { getParcours, getParcoursProgress } from './parcours';

const defaultSupabase = createClient();

export const CECRL_LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;
export type CecrlLevel = typeof CECRL_LEVELS[number];
export type Section = 'A' | 'B';

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

/**
 * Étape EE ou EO intercalée entre deux parcours (retour Olivier après tests
 * manuels : 1 EE après CHAQUE parcours, 1 EO après un parcours sur deux --
 * pour un niveau à 4 parcours, ça donne 4 EE et 2 EO). Chaque étape cible en
 * plus une section précise du TEF IRN (A ou B, cf. writing_exam_scenarios.
 * section / oral_session_results.section, CHECK IN ('A','B')), en
 * alternance stricte (A, B, A, B pour les 4 EE ; A, B pour les 2 EO) --
 * donne 2 EE-A + 2 EE-B et 1 EO-A + 1 EO-B sur un niveau à 4 parcours.
 *
 * `index`/`total` sont comptés PAR SECTION (ex. "Rédaction A 2/2"), pas sur
 * l'ensemble EE confondu -- "fait" = le nombre de tentatives de CETTE
 * section à ce niveau a atteint `index` (cumulatif : les tables writing_
 * scenario_attempts / oral_session_results n'ont pas de notion de
 * checkpoint dédié, donc n'importe quelle tentative de la bonne section
 * compte, pas une tentative pré-assignée à cette étape précise).
 */
export interface ChecklistStepStatus {
  done: boolean;
  href: string;
  section: Section;
  index: number;
  total: number;
  /** Le parcours qui précède immédiatement cette étape est terminé -- purement
   *  informatif pour le libellé affiché, jamais un verrou (voir plus bas). */
  unlocked: boolean;
}

export type LevelStep =
  | { kind: 'parcours'; data: ParcoursStepStatus }
  | { kind: 'ee'; data: ChecklistStepStatus }
  | { kind: 'eo'; data: ChecklistStepStatus }
  | { kind: 'exam'; data: CheckpointStatus & { unlocked: boolean } };

export interface LevelProgression {
  level: CecrlLevel;
  steps: LevelStep[];
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
 * Choisit UN examen précis pour le checkpoint d'un niveau, parmi ceux qui le
 * couvrent (plusieurs peuvent matcher, ex. B1 est couvert par 'A2-B1', 'B1'
 * ET 'B1-B2') -- priorité à la correspondance exacte ('B1' pour le niveau
 * B1), sinon le premier de la liste. Permet au checkpoint "Examen blanc" de
 * /tef-irn/progression de renvoyer vers un examen précis (?examId=...)
 * plutôt que vers le catalogue générique.
 */
function pickExamForLevel(exams: { id: string; level: string | null }[], level: CecrlLevel) {
  const matching = exams.filter((e) => e.level && examCoversLevel(e.level, level));
  return matching.find((e) => e.level === level) || matching[0] || null;
}

/**
 * Compte, pour un niveau et une table donnée (writing_scenario_attempts ou
 * oral_session_results), le nombre de tentatives par section ('A'/'B').
 */
async function countAttemptsBySection(
  supabase: SupabaseClient,
  table: 'writing_scenario_attempts' | 'oral_session_results',
  userId: string,
  level: CecrlLevel
): Promise<Record<Section, number>> {
  const [a, b] = await Promise.all([
    supabase.from(table).select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('level', level).eq('section', 'A'),
    supabase.from(table).select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('level', level).eq('section', 'B'),
  ]);
  return { A: a.count || 0, B: b.count || 0 };
}

/**
 * Progression macro par niveau CECRL (A1 à B2) : une séquence d'étapes
 * ordonnée -- parcours, avec une étape EE après chacun (section A/B en
 * alternance) et une étape EO un parcours sur deux (section A/B en
 * alternance), puis un examen blanc final -- alimente la page
 * /tef-irn/progression (accordéons).
 *
 * "Fait" pour l'examen blanc = au moins une tentative CE/CO sur un examen
 * couvrant ce niveau. Aucun de ces calculs n'est un score minimum, et rien
 * ici ne bloque l'accès (mode libre toujours disponible en parallèle) --
 * ce ne sont que des repères visuels.
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

    const parcoursStatuses: ParcoursStepStatus[] = await Promise.all(
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

    const hasChecklist = EE_EO_EXAM_LEVELS.includes(level);
    const steps: LevelStep[] = [];

    if (!hasChecklist) {
      parcoursStatuses.forEach((p) => steps.push({ kind: 'parcours', data: p }));
    } else {
      const [eeDoneBySection, eoDoneBySection] = await Promise.all([
        countAttemptsBySection(supabase, 'writing_scenario_attempts', userId, level),
        countAttemptsBySection(supabase, 'oral_session_results', userId, level),
      ]);

      const eeTotalSteps = parcoursStatuses.length;
      const eoTotalSteps = Math.floor(parcoursStatuses.length / 2);
      // Alternance stricte A, B, A, B... -- total par section = moitié
      // arrondie au supérieur pour A (elle démarre l'alternance).
      const eeTotalBySection: Record<Section, number> = { A: Math.ceil(eeTotalSteps / 2), B: Math.floor(eeTotalSteps / 2) };
      const eoTotalBySection: Record<Section, number> = { A: Math.ceil(eoTotalSteps / 2), B: Math.floor(eoTotalSteps / 2) };

      let eeOverallIndex = 0;
      let eoOverallIndex = 0;
      let allPreviousParcoursDone = true;

      parcoursStatuses.forEach((p, i) => {
        steps.push({ kind: 'parcours', data: p });
        allPreviousParcoursDone = allPreviousParcoursDone && p.isCompleted;

        eeOverallIndex += 1;
        const eeSection: Section = eeOverallIndex % 2 === 1 ? 'A' : 'B';
        const eeIndexInSection = Math.ceil(eeOverallIndex / 2);
        steps.push({
          kind: 'ee',
          data: {
            done: eeDoneBySection[eeSection] >= eeIndexInSection,
            href: `/tef-irn/writing?level=${level}&section=${eeSection}`,
            section: eeSection,
            index: eeIndexInSection,
            total: eeTotalBySection[eeSection],
            unlocked: p.isCompleted,
          },
        });

        if ((i + 1) % 2 === 0) {
          eoOverallIndex += 1;
          const eoSection: Section = eoOverallIndex % 2 === 1 ? 'A' : 'B';
          const eoIndexInSection = Math.ceil(eoOverallIndex / 2);
          steps.push({
            kind: 'eo',
            data: {
              done: eoDoneBySection[eoSection] >= eoIndexInSection,
              href: `/tef-irn/oral?level=${level}&section=${eoSection}`,
              section: eoSection,
              index: eoIndexInSection,
              total: eoTotalBySection[eoSection],
              unlocked: p.isCompleted,
            },
          });
        }
      });

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
      const targetExam = pickExamForLevel(exams, level);
      steps.push({
        kind: 'exam',
        data: {
          done: examDone,
          // targetExam ne devrait être null que si aucun examen n'existe
          // encore pour ce niveau -- repli sur le catalogue générique dans
          // ce cas, jamais atteint aujourd'hui pour A2/B1/B2.
          href: targetExam ? `/tef-irn/exam?examId=${targetExam.id}` : '/tef-irn/exam',
          unlocked: allPreviousParcoursDone,
        },
      });
    }

    const isLevelComplete = steps.every((s) => (s.kind === 'parcours' ? s.data.isCompleted : s.data.done));

    results.push({ level, steps, isLevelComplete });
  }

  return results;
}
