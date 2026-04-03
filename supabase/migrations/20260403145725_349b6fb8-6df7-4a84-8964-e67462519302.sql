ALTER TABLE public.monthly_reviews ADD COLUMN IF NOT EXISTS month integer;
ALTER TABLE public.monthly_reviews ADD COLUMN IF NOT EXISTS year integer;
ALTER TABLE public.monthly_reviews ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE public.monthly_reviews ADD COLUMN IF NOT EXISTS review_data jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'monthly_reviews_user_month_year_unique'
  ) THEN
    ALTER TABLE public.monthly_reviews ADD CONSTRAINT monthly_reviews_user_month_year_unique UNIQUE (user_id, month, year);
  END IF;
END $$;