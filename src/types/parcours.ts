export interface Parcours {
  id: string;
  level: string;
  category: string;
  objective: string;
  created_at?: string;
}

export interface Lesson {
  id: string;
  title: string;
  order_index: number;
  level: string;
  category: string;
  content?: string;
  created_at?: string;
}

export interface ParcoursProgress {
  total: number;
  completed: number;
  percent: number;
  isCompleted: boolean;
}

export interface UserParcoursProgress {
  id: string;
  user_id: string;
  parcours_id: string;
  current_lesson_id: string | null;
  status: 'in_progress' | 'completed';
  progress_percentage: number;
  started_at: string;
  last_activity_at: string;
  last_practice_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParcoursContextType {
  activeParcours: Parcours | null;
  progress: ParcoursProgress | null;
  userProgress: UserParcoursProgress | null;
  isLoading: boolean;
  lessons: (Lesson & { isCompleted: boolean })[];
  currentLesson: Lesson | null;
  nextLesson: Lesson | null;
  activateParcours: (parcoursId: string) => Promise<void>;
  updateLessonProgress: (lessonId: string) => Promise<void>;
  exitParcours: () => void;
  refreshProgress: () => Promise<void>;
}
