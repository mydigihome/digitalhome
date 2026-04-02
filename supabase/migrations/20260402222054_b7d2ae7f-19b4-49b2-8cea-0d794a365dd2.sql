
ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS mood text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS audio_url text;
