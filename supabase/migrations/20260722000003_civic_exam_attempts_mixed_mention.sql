-- Autorise le mode "examen blanc mixte" (toutes mentions confondues) sur civic_exam_attempts.
ALTER TABLE civic_exam_attempts DROP CONSTRAINT IF EXISTS civic_exam_attempts_mention_check;
ALTER TABLE civic_exam_attempts ADD CONSTRAINT civic_exam_attempts_mention_check
    CHECK (mention IN ('csp', 'cr', 'naturalisation', 'toutes'));
