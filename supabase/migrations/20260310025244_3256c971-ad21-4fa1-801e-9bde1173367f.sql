
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS money_header_type TEXT DEFAULT 'color',
  ADD COLUMN IF NOT EXISTS money_header_value TEXT DEFAULT '#6366F1',
  ADD COLUMN IF NOT EXISTS applications_header_type TEXT DEFAULT 'color',
  ADD COLUMN IF NOT EXISTS applications_header_value TEXT DEFAULT '#6366F1';
