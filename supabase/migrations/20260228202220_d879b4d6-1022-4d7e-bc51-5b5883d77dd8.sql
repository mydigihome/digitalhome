
-- Create trading_plans table
CREATE TABLE public.trading_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  current_price NUMERIC,
  entry_price NUMERIC,
  position_size NUMERIC,
  total_investment NUMERIC,
  stop_loss NUMERIC,
  take_profit_1 NUMERIC,
  take_profit_2 NUMERIC,
  risk_reward_ratio NUMERIC,
  strategy_notes TEXT,
  time_frame TEXT NOT NULL DEFAULT 'swing',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trading_plans ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Users manage own trading plans"
  ON public.trading_plans
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_trading_plans_updated_at
  BEFORE UPDATE ON public.trading_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
