import { Parcours as DBParcours, Lesson as DBLesson } from "@/lib/parcours";

export interface Parcours extends DBParcours {}
export interface Lesson extends DBLesson {
  isCompleted?: boolean;
}

export interface ParcoursProgress {
  total: number;
  completed: number;
  percent: number;
  isCompleted: boolean;
}

export interface UserParcoursProgress {
  user_id: string;
  parcours_id: string;
  current_lesson_id: string | null;
  last_activity_at: string;
  progress_percent: number;
}
