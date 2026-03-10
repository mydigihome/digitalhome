
-- Create trading_pairs table
CREATE TABLE public.trading_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Stocks',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.trading_pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own trading pairs"
  ON public.trading_pairs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_trading_pairs_user ON public.trading_pairs(user_id);

-- Add new columns to trading_plans
ALTER TABLE public.trading_plans
  ADD COLUMN IF NOT EXISTS trading_pair_id UUID REFERENCES public.trading_pairs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS target_price NUMERIC,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_trading_plans_status ON public.trading_plans(status);
