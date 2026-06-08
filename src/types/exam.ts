export type ExamSectionType = 'CO' | 'CE' | 'EE' | 'EO';

export type QuestionType = 'audio' | 'text' | 'writing' | 'speaking';

export interface BaseQuestion {
  id: string;
  section: ExamSectionType;
  type: QuestionType;
  instructions?: string;
}

export interface QCMQuestion extends BaseQuestion {
  type: 'audio' | 'text';
  question: string;
  options: string[];
  correctAnswer: string; // 'A', 'B', 'C', 'D'
  audioUrl?: string;
  maxPlays?: number;
  transcription?: string;
  texte?: string;
  imageUrl?: string;
}

export interface WritingQuestion extends BaseQuestion {
  type: 'writing';
  prompt: string;
  minWords: number;
  maxTime: number; // in minutes
  modelAnswer?: string;
}

export interface SpeakingQuestion extends BaseQuestion {
  type: 'speaking';
  prompt: string;
  prepTime: number; // in minutes
  speakTime: number; // in minutes
  modelAnswer?: string;
}

export type Question = QCMQuestion | WritingQuestion | SpeakingQuestion;

export interface ExamSessionState {
  section: ExamSectionType;
  currentQuestionIndex: number;
  answers: Record<string, string>; // questionId -> answer
  status: 'idle' | 'in_progress' | 'paused' | 'finished';
  startedAt?: number; // timestamp
  examType: 'single' | 'full';
  selectedSection?: ExamSectionType;
}

export interface ExamResult {
  section: ExamSectionType;
  score: number;
  total: number;
  answers: Array<{
    questionId: string;
    userAnswer: string;
    isCorrect: boolean;
    correctAnswer: string;
  }>;
  writingProductions?: Record<string, string>;
  date: number;
}
