
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS trial_start_date timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS trial_end_date timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_subscribed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS student_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS student_email text DEFAULT NULL;
