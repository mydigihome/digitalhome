
ALTER TABLE public.user_preferences 
  ADD COLUMN IF NOT EXISTS home_name TEXT,
  ADD COLUMN IF NOT EXISTS home_style TEXT DEFAULT 'modern',
  ADD COLUMN IF NOT EXISTS onboarding_focus TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
