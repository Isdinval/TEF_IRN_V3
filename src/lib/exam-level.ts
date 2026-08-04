import { ExamResult, ExamSectionType } from '@/types/exam';

export type CecrlLevel = 'A1' | 'A2' | 'B1' | 'B2';

const LEVEL_ORDER: CecrlLevel[] = ['A1', 'A2', 'B1', 'B2'];

/**
 * Référentiel officiel TEF IRN (France Compétences) : chaque épreuve (CE, CO, EE, EO)
 * est notée indépendamment sur une échelle de points, convertie en niveau CECRL via :
 *   200-299 -> A2 | 300-399 -> B1 | 400-499 -> B2 (en-dessous de 200 -> A1, palier implicite)
 *
 * Le barème officiel repose sur une pondération psychométrique propre à chaque question,
 * propriété du certificateur — nous n'y avons pas accès. Ce module projette donc
 * linéairement notre performance brute (% de bonnes réponses, score IA/100, niveau oral
 * estimé) sur cette même échelle 0-499, À TITRE INDICATIF UNIQUEMENT. Ce n'est pas un
 * score TEF IRN officiel.
 */
function pointsToLevel(points: number): CecrlLevel {
  if (points >= 400) return 'B2';
  if (points >= 300) return 'B1';
  if (points >= 200) return 'A2';
  return 'A1';
}

const ORAL_ESTIMATED_LEVEL_POINTS: Record<string, number> = {
  '<A1': 100,
  A1: 150,
  A2: 250,
  B1: 350,
  B2: 450,
};

export interface SkillLevelResult {
  section: ExamSectionType;
  points: number;
  level: CecrlLevel;
}

export function computeSkillLevels(sessionResults: ExamResult[]): SkillLevelResult[] {
  return sessionResults.map((result) => {
    let points: number;

    if (result.section === 'EE' && result.writingFeedbacks && Object.keys(result.writingFeedbacks).length > 0) {
      const scores = Object.values(result.writingFeedbacks).map((f) => f.score_global);
      const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      points = Math.round((avg / 100) * 499);
    } else if (result.section === 'EO' && result.oralAnalyses && Object.keys(result.oralAnalyses).length > 0) {
      const analyses = Object.values(result.oralAnalyses);
      const levelPoints = analyses.map((a) => ORAL_ESTIMATED_LEVEL_POINTS[a.estimated_level] ?? 0);
      points = Math.round(levelPoints.reduce((sum, p) => sum + p, 0) / levelPoints.length);
    } else {
      // CO / CE (QCM) : pourcentage de bonnes réponses
      points = result.total > 0 ? Math.round((result.score / result.total) * 499) : 0;
    }

    return { section: result.section, points, level: pointsToLevel(points) };
  });
}

export interface GlobalLevelResult {
  level: CecrlLevel;
  plus: boolean;
}

/**
 * Niveau global = le niveau le plus bas des compétences évaluées (logique "maillon
 * faible", cohérente avec le principe des certifications de langue par compétence).
 *
 * Un "+" est ajouté si au moins la moitié des compétences évaluées se situent
 * STRICTEMENT au-dessus de ce niveau plancher (ex. 2 épreuves > 400 pts et 1 épreuve
 * à 300 pts sur 4 -> plancher B1, 2 épreuves au-dessus -> "B1+").
 */
export function computeGlobalLevel(skillLevels: SkillLevelResult[]): GlobalLevelResult | null {
  if (skillLevels.length === 0) return null;

  const levelIndices = skillLevels.map((s) => LEVEL_ORDER.indexOf(s.level));
  const floorIndex = Math.min(...levelIndices);
  const aboveFloorCount = levelIndices.filter((i) => i > floorIndex).length;
  const plus = aboveFloorCount >= Math.ceil(skillLevels.length / 2);

  return { level: LEVEL_ORDER[floorIndex], plus };
}
