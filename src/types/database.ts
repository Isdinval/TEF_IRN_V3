export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  current_level: 'A1' | 'A2' | 'B1' | 'B2' | null;
  goal_level: 'A2' | 'B1' | 'B2' | null;
  total_xp: number;
  streak_count: number;
  last_activity_at: string;
}

export interface ExerciseAttempt {
  id: string;
  user_id: string;
  exercise_id: string;
  score: number | null;
  is_completed: boolean;
  created_at: string;
}

export interface Recommendation {
  id: string;
  user_id: string;
  type: 'lesson' | 'exercise' | 'review';
  reference_id: string | null;
  reason: string | null;
  status: 'pending' | 'completed' | 'dismissed';
  created_at: string;
}
