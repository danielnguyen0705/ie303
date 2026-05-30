CREATE INDEX IF NOT EXISTS idx_users_user_name
    ON users (user_name);

CREATE INDEX IF NOT EXISTS idx_units_grade_number
    ON units (grade_id, unit_number);

CREATE INDEX IF NOT EXISTS idx_sections_unit_number
    ON sections (unit_id, section_number);

CREATE INDEX IF NOT EXISTS idx_lessons_section_order
    ON lessons (section_id, order_index, lesson_number, id);

CREATE INDEX IF NOT EXISTS idx_questions_lesson_id
    ON questions (lesson_id);

CREATE INDEX IF NOT EXISTS idx_questions_group_id
    ON questions (question_group_id);

CREATE INDEX IF NOT EXISTS idx_question_groups_lesson_id
    ON question_groups (lesson_id);

CREATE INDEX IF NOT EXISTS idx_question_options_question_id
    ON question_options (question_id);

CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson_id
    ON user_lesson_progress (lesson_id);

CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_completed_at
    ON user_lesson_progress (user_id, completed, completed_at);

CREATE INDEX IF NOT EXISTS idx_user_question_history_user_question
    ON user_question_history (user_id, question_id);

CREATE INDEX IF NOT EXISTS idx_user_question_history_question_id
    ON user_question_history (question_id);

CREATE INDEX IF NOT EXISTS idx_user_question_history_user_answered_at
    ON user_question_history (user_id, answered_at);

CREATE INDEX IF NOT EXISTS idx_skip_usage_logs_user_used_at
    ON skip_usage_logs (user_id, used_at);

CREATE INDEX IF NOT EXISTS idx_ai_learning_analysis_user_generated_at
    ON ai_learning_analysis (user_id, generated_at DESC);
