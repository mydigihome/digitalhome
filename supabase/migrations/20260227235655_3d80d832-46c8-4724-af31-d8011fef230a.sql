
-- Core financial profile per user
CREATE TABLE public.user_finances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  monthly_income numeric NOT NULL DEFAULT 0,
  total_debt numeric NOT NULL DEFAULT 0,
  credit_score integer,
  savings_goal numeric NOT NULL DEFAULT 0,
  current_savings numeric NOT NULL DEFAULT 0,
  has_student_loans boolean NOT NULL DEFAULT false,
  invests boolean NOT NULL DEFAULT false,
  investment_types text[] DEFAULT '{}',
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_finances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own finances"
  ON public.user_finances FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_finances_updated_at
  BEFORE UPDATE ON public.user_finances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Loans table
CREATE TABLE public.loans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  loan_type text NOT NULL DEFAULT 'student',
  amount numeric NOT NULL DEFAULT 0,
  interest_rate numeric NOT NULL DEFAULT 0,
  monthly_payment numeric NOT NULL DEFAULT 0,
  provider_name text,
  provider_phone text,
  provider_website text,
  start_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own loans"
  ON public.loans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Child investments
CREATE TABLE public.child_investments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  child_name text NOT NULL,
  investment_type text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.child_investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own child investments"
  ON public.child_investments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Custom layout preferences
CREATE TABLE public.wealth_layout (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  hidden_cards jsonb NOT NULL DEFAULT '[]',
  card_order jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.wealth_layout ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own layout"
  ON public.wealth_layout FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_wealth_layout_updated_at
  BEFORE UPDATE ON public.wealth_layout
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
