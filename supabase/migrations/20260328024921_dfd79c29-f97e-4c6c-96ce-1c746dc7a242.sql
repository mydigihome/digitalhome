
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS founding_member_since timestamptz,
  ADD COLUMN IF NOT EXISTS lifetime_offer_dismissed boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public.admin_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reminder_type text NOT NULL,
  message text NOT NULL,
  remind_at timestamptz NOT NULL,
  dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reminders"
  ON public.admin_reminders FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
