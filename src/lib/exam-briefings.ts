import { ExamSectionType } from '@/types/exam';

export interface SectionBriefing {
  rules: string[];
  tips: string[];
}

export const SECTION_BRIEFINGS: Record<ExamSectionType, SectionBriefing> = {
  CO: {
    rules: [
      "Chaque piste audio ne peut être écoutée qu'un nombre limité de fois, indiqué sur la question.",
      'Vous pouvez naviguer librement entre les questions de cette épreuve.',
    ],
    tips: [
      "Lisez les options de réponse avant de lancer l'audio, pour savoir quoi repérer.",
      'Notez les mots-clés dès la première écoute.',
    ],
  },
  CE: {
    rules: [
      "Vous pouvez revenir sur une question et modifier votre réponse tant que l'épreuve n'est pas terminée.",
    ],
    tips: [
      'Repérez la question avant de lire le texte en détail.',
      'Ne restez pas bloqué sur une question : passez et revenez-y plus tard.',
    ],
  },
  EE: {
    rules: [
      'Un nombre minimum de mots est attendu pour chaque production, indiqué sur la consigne.',
      "Vous pouvez revenir sur vos productions précédentes tant que l'épreuve est en cours.",
    ],
    tips: [
      'Structurez votre texte avant de rédiger (introduction, développement, conclusion).',
      'Gardez quelques minutes en fin d\'épreuve pour vous relire.',
    ],
  },
  EO: {
    rules: [
      'Un temps de préparation puis un temps de parole sont prévus pour chaque question.',
      'Vous ne pouvez pas revenir à une question précédente une fois votre réponse enregistrée : passez à la suivante uniquement quand vous êtes prêt.',
    ],
    tips: [
      'Utilisez tout le temps de préparation pour structurer vos idées.',
      'Si vous hésitez sur un mot, enchaînez : la fluidité compte plus que la perfection.',
    ],
  },
};
