-- Add indexes for journal performance optimization
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_created ON public.journal_entries (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date ON public.journal_entries (user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_media_entry ON public.journal_media (entry_id);