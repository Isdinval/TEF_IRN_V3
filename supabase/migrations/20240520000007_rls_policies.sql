-- Activation des politiques de lecture (RLS) pour les tables publiques

-- 1. LESSONS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for all users" ON lessons FOR SELECT USING (true);

-- 2. EXERCISES
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for all users" ON exercises FOR SELECT USING (true);

-- 3. VOCABULARY
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for all users" ON vocabulary FOR SELECT USING (true);

-- 4. PROFILES (Déjà créé probablement, mais on s'assure)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 5. EXERCISE ATTEMPTS
ALTER TABLE exercise_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own attempts" ON exercise_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own attempts" ON exercise_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. LESSON PROGRESS
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own progress" ON lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. RECOMMENDATIONS
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own recommendations" ON recommendations FOR SELECT USING (auth.uid() = user_id);

-- 8. USER REVIEWS (SRS)
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own reviews" ON user_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON user_reviews FOR ALL USING (auth.uid() = user_id);
