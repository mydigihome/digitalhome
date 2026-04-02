
-- Create loan_applications table
CREATE TABLE public.loan_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount decimal NOT NULL,
  fee decimal NOT NULL,
  interest_rate decimal NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own loan applications"
  ON public.loan_applications FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create debts table
CREATE TABLE public.debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  creditor text NOT NULL,
  type text NOT NULL,
  balance decimal NOT NULL,
  interest_rate decimal NOT NULL,
  monthly_payment decimal NOT NULL,
  due_date date,
  status text NOT NULL DEFAULT 'current',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own debts"
  ON public.debts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
