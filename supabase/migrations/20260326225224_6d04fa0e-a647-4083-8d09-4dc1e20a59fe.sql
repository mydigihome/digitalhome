
-- Money tab preferences
CREATE TABLE public.money_tab_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  card_order text[] DEFAULT ARRAY['plaid','net-worth','spending','debt','credit-score','bills','moneyflow','emergency','salary','tradingview'],
  hidden_cards text[] DEFAULT '{}',
  card_data jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.money_tab_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own money preferences" ON public.money_tab_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Plaid items
CREATE TABLE public.plaid_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  access_token text NOT NULL,
  item_id text NOT NULL,
  institution_name text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.plaid_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their plaid items" ON public.plaid_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Plaid accounts
CREATE TABLE public.plaid_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plaid_item_id uuid REFERENCES public.plaid_items ON DELETE CASCADE,
  account_id text UNIQUE,
  name text,
  type text,
  subtype text,
  balance_current numeric,
  balance_available numeric,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.plaid_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their accounts" ON public.plaid_accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Plaid transactions
CREATE TABLE public.plaid_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  transaction_id text UNIQUE,
  account_id text,
  amount numeric,
  name text,
  merchant_name text,
  category text[],
  date date,
  pending boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.plaid_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their transactions" ON public.plaid_transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
