
-- Income history table
CREATE TABLE IF NOT EXISTS public.income_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  year INTEGER NOT NULL,
  total_income NUMERIC NOT NULL,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, year)
);

CREATE INDEX IF NOT EXISTS idx_income_history_user ON public.income_history(user_id, year DESC);

ALTER TABLE public.income_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own income history"
  ON public.income_history
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add source tracking to expenses if not exists
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS plaid_transaction_id TEXT;
