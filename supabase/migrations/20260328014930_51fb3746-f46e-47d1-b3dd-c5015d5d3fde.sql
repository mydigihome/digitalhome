ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_skipped_steps text[] DEFAULT '{}';