-- Add UPDATE policies for lesson_progress and exercise_attempts
-- to ensure users can only update their own records.

CREATE POLICY "Users can update their own attempts" ON "public"."exercise_attempts"
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON "public"."lesson_progress"
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
