export interface Parcours {
  id: string;
  level: string;
  category: string;
  objective: string;
}

export interface ParcoursProgress {
  total: number;
  completed: number;
  percent: number;
  isCompleted: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  order_index: number;
  level: string;
  category: string;
}
