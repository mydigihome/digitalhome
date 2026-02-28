
-- Journal entries table
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT DEFAULT 'Untitled Entry',
  content JSONB,
  content_preview TEXT,
  mood_emoji TEXT,
  mood_text TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  pin_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own journal entries"
ON public.journal_entries FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Journal media table
CREATE TABLE public.journal_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL DEFAULT 'image',
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.journal_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own journal media"
ON public.journal_media FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.journal_entries
  WHERE journal_entries.id = journal_media.entry_id
  AND journal_entries.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.journal_entries
  WHERE journal_entries.id = journal_media.entry_id
  AND journal_entries.user_id = auth.uid()
));

-- Journal activities table (drawing, coloring, puzzles)
CREATE TABLE public.journal_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.journal_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own journal activities"
ON public.journal_activities FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.journal_entries
  WHERE journal_entries.id = journal_activities.entry_id
  AND journal_entries.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.journal_entries
  WHERE journal_entries.id = journal_activities.entry_id
  AND journal_entries.user_id = auth.uid()
));

-- Storage bucket for journal media
INSERT INTO storage.buckets (id, name, public) VALUES ('journal-media', 'journal-media', false);

CREATE POLICY "Users upload own journal media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'journal-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users view own journal media"
ON storage.objects FOR SELECT
USING (bucket_id = 'journal-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own journal media"
ON storage.objects FOR DELETE
USING (bucket_id = 'journal-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger for updated_at
CREATE TRIGGER update_journal_entries_updated_at
BEFORE UPDATE ON public.journal_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
