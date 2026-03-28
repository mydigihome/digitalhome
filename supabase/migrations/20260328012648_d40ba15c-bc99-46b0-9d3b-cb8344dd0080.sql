
CREATE TABLE IF NOT EXISTS public.monthly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  review_month text NOT NULL,
  review_date timestamptz DEFAULT now(),
  net_worth numeric,
  top_spending_category text,
  goals_progress numeric,
  contacts_reached integer,
  bills_paid integer,
  credit_score integer,
  ai_summary text,
  full_snapshot jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, review_month)
);

ALTER TABLE public.monthly_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their reviews"
  ON public.monthly_reviews FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS last_review_month text,
  ADD COLUMN IF NOT EXISTS greeting_dismissed_date date;
