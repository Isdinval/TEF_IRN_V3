import { Question } from '../types/exam';

export const EXAM_QUESTIONS: Question[] = [
  // COMPRÉHENSION ORALE (20 questions)
  ...Array.from({ length: 20 }).map((_, i) => ({
    id: `co-${i + 1}`,
    section: 'CO' as const,
    type: 'audio' as const,
    question: i % 2 === 0 ? "Quelle est la raison principale de cet appel ?" : "Où se déroule la scène ?",
    options: ["A) Une demande d'information", "B) Une annulation", "C) Une réclamation", "D) Une prise de rendez-vous"],
    correctAnswer: "A",
    audioUrl: `/mock/audio-co-${i + 1}.mp3`,
    maxPlays: i < 10 ? 2 : 1,
    transcription: "Ceci est une transcription de l'audio " + (i + 1),
    instructions: "Écoutez attentivement le document sonore et répondez à la question."
  })),

  // COMPRÉHENSION ÉCRITE (20 questions)
  ...Array.from({ length: 20 }).map((_, i) => ({
    id: `ce-${i + 1}`,
    section: 'CE' as const,
    type: 'text' as const,
    texte: i % 2 === 0
      ? "La mairie informe les citoyens que la collecte des déchets sera décalée au mardi en raison du jour férié."
      : "Le centre commercial sera exceptionnellement ouvert ce dimanche de 10h à 19h pour les soldes d'hiver.",
    question: i % 2 === 0 ? "Quand aura lieu la collecte des déchets ?" : "À quelle heure ferme le centre commercial dimanche ?",
    options: i % 2 === 0
      ? ["A) Lundi", "B) Mardi", "C) Mercredi", "D) Dimanche"]
      : ["A) 10h", "B) 18h", "C) 19h", "D) 20h"],
    correctAnswer: "B",
    instructions: "Lisez le texte et choisissez la bonne réponse."
  })),

  // EXPRESSION ÉCRITE (2 sections)
  {
    id: 'ee-a',
    section: 'EE',
    type: 'writing',
    instructions: "Section A : Rédiger un message pour prendre des nouvelles.",
    prompt: "Vous écrivez à un(e) ami(e) français(e) que vous n'avez pas vu(e) depuis longtemps. Vous lui demandez comment il/elle va et vous lui proposez de se rencontrer prochainement. (40 mots minimum)",
    minWords: 40,
    maxTime: 10
  },
  {
    id: 'ee-b',
    section: 'EE',
    type: 'writing',
    instructions: "Section B : Exposer ses motivations pour convaincre.",
    prompt: "Vous avez lu une annonce dans le journal : une association recherche des bénévoles pour aider des enfants à faire leurs devoirs. Vous écrivez au responsable pour présenter votre candidature et expliquer pourquoi vous voulez faire ce bénévolat. (100 mots minimum)",
    minWords: 100,
    maxTime: 20
  },

  // EXPRESSION ORALE (2 sections)
  {
    id: 'eo-a',
    section: 'EO',
    type: 'speaking',
    instructions: "Section A : Téléphoner pour obtenir des informations.",
    prompt: "Vous avez vu une annonce pour une colocation. Vous téléphonez au propriétaire pour poser des questions sur la chambre, le loyer, et les autres colocataires. Préparez vos questions.",
    prepTime: 1,
    speakTime: 5
  },
  {
    id: 'eo-b',
    section: 'EO',
    type: 'speaking',
    instructions: "Section B : Aider un(e) ami(e) à prendre une décision.",
    prompt: "Un(e) ami(e) hésite à s'inscrire à un cours de cuisine. Vous essayez de le/la convaincre d'y aller avec vous en lui montrant les avantages de cette activité.",
    prepTime: 1,
    speakTime: 5
  }
];
