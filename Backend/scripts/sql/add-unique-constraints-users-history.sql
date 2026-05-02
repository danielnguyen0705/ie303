BEGIN;

-- Keep one row per username/email before adding unique constraints.
DELETE FROM users u
USING users dup
WHERE u.id > dup.id
  AND u.user_name = dup.user_name;

DELETE FROM users u
USING users dup
WHERE u.id > dup.id
  AND u.email = dup.email;

-- Keep only the newest answer per (user, question).
DELETE FROM user_question_history h
USING user_question_history newer
WHERE h.id < newer.id
  AND h.user_id = newer.user_id
  AND h.question_id = newer.question_id;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uk_users_user_name'
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT uk_users_user_name UNIQUE (user_name);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uk_users_email'
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT uk_users_email UNIQUE (email);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uk_user_question_history_user_question'
    ) THEN
        ALTER TABLE user_question_history
            ADD CONSTRAINT uk_user_question_history_user_question
                UNIQUE (user_id, question_id);
    END IF;
END
$$;

COMMIT;
