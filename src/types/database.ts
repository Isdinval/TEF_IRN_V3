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
  onboarding_completed: boolean;
  target_exam_date: string | null;
  weekly_availability: 'lt_2h' | '2_5h' | '5_10h' | 'gt_10h' | null;
  weak_skill: 'comprehension_orale' | 'comprehension_ecrite' | 'expression_orale' | 'expression_ecrite' | null;
  learning_mode: 'academique' | 'libre' | null;
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

export interface ChatSession {
  id: string;
  user_id: string;
  title: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  metadata: any;
  created_at: string;
}

export interface CoachGeneratedExercise {
  id: string;
  user_id: string;
  session_id: string | null;
  message_id: string | null;
  content: any;
  type: string;
  created_at: string;
}
