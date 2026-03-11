
CREATE TABLE public.investment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  weekly_leftover NUMERIC NOT NULL,
  company_name TEXT NOT NULL,
  is_private_company BOOLEAN DEFAULT false,
  investment_type TEXT NOT NULL DEFAULT 'stocks',
  investment_platform TEXT,
  platform_url TEXT,
  frequency TEXT NOT NULL DEFAULT 'weekly',
  amount_per_investment NUMERIC NOT NULL,
  next_investment_date DATE NOT NULL,
  total_invested NUMERIC DEFAULT 0,
  investment_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.investment_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own investment allocations"
  ON public.investment_allocations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_investment_allocations_user ON public.investment_allocations(user_id);

CREATE TABLE public.student_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  loan_name TEXT NOT NULL,
  total_owed NUMERIC NOT NULL,
  remaining_balance NUMERIC NOT NULL,
  interest_rate NUMERIC,
  monthly_payment NUMERIC,
  loan_servicer TEXT,
  loan_officer_name TEXT,
  loan_officer_phone TEXT,
  loan_officer_email TEXT,
  servicer_website TEXT,
  payment_due_day INTEGER,
  loan_type TEXT NOT NULL DEFAULT 'federal',
  status TEXT NOT NULL DEFAULT 'in_repayment',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.student_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own student loans"
  ON public.student_loans
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_student_loans_user ON public.student_loans(user_id);
