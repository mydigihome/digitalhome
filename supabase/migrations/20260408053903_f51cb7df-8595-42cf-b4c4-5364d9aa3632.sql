ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS plaid_connected boolean DEFAULT false;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS plaid_access_token text;