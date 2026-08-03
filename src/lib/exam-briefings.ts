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
      'Concentrez-vous sur le sens général avant de vous focaliser sur les détails.',
      "Ne bloquez pas sur un mot inconnu : continuez à écouter la suite.",
      'Repérez les intonations et changements de ton, ils donnent des indices.',
      "Éliminez d'abord les réponses clairement fausses.",
    ],
  },
  CE: {
    rules: [
      "Vous pouvez revenir sur une question et modifier votre réponse tant que l'épreuve n'est pas terminée.",
    ],
    tips: [
      'Repérez la question avant de lire le texte en détail.',
      'Ne restez pas bloqué sur une question : passez et revenez-y plus tard.',
      'Repérez les connecteurs logiques (mais, donc, cependant) pour suivre le raisonnement du texte.',
      'Survolez le texte une première fois avant de répondre en détail.',
      'Méfiez-vous des réponses qui reprennent les mots du texte mais en changent le sens.',
      'Gérez votre temps : ne passez pas trop longtemps sur une seule question.',
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
      'Utilisez des connecteurs logiques pour lier vos idées entre elles.',
      'Variez le vocabulaire plutôt que de répéter les mêmes mots.',
      'Restez sur le sujet demandé : une rédaction hors-sujet reste hors-sujet, même bien écrite.',
      'En vous relisant, vérifiez en priorité les accords sujet-verbe et les temps utilisés.',
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
      'Articulez et parlez à un rythme naturel, ni trop vite ni trop lentement.',
      'Donnez des exemples concrets pour illustrer vos propos.',
      'Reformulez la question dans votre réponse pour bien cadrer votre discours.',
      'Gardez un ton naturel et spontané, plutôt que de réciter un texte appris par cœur.',
    ],
  },
};

/** Tire aléatoirement `count` conseils distincts dans le pool d'une épreuve, sans mutation. */
export function pickRandomTips(tips: string[], count: number = 2): string[] {
  const shuffled = [...tips].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
