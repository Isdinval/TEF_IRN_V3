export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  email?: string;
  avatar_url: string | null;
  current_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | null;
  goal_level: 'A2' | 'B1' | 'B2' | null;
  total_xp: number;
  streak_count: number;
  last_activity_at: string;
  subscription_tier: 'free' | 'premium' | 'pro';
  ai_credits: number;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  email_marketing: boolean;
  email_reminders: boolean;
  email_new_courses: boolean;
  email_results: boolean;
  email_promotions: boolean;
  push_enabled: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  created_at: string;
  updated_at: string;
}

export interface ExerciseAttempt {
  id: string;
  user_id: string;
  exercise_id: string;
  score: number | null;
  is_completed: boolean;
  created_at: string;
  feedback?: any;
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
