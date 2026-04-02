
ALTER TABLE public.trading_plans
  ADD COLUMN IF NOT EXISTS plan_content text,
  ADD COLUMN IF NOT EXISTS risk_tolerance text DEFAULT 'moderate',
  ADD COLUMN IF NOT EXISTS account_size decimal;

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS preferred_broker text,
  ADD COLUMN IF NOT EXISTS broker_url text;
