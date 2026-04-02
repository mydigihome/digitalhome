
-- Studio Profile table
CREATE TABLE public.studio_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  studio_name text,
  handle text,
  description text,
  instagram_handle text,
  youtube_url text,
  tiktok_handle text,
  twitter_handle text,
  llc_document text,
  ein_number text,
  pitch_deck text,
  business_license text,
  total_followers int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.studio_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own studio profile"
  ON public.studio_profile FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Studio Goals table
CREATE TABLE public.studio_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  progress int DEFAULT 0,
  deadline date,
  category text DEFAULT 'Other',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.studio_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own studio goals"
  ON public.studio_goals FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket for studio documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('studio-documents', 'studio-documents', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own studio docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'studio-documents' AND (storage.foldername(name))[1] = 'studio-docs' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY "Users read own studio docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'studio-documents' AND (storage.foldername(name))[1] = 'studio-docs' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY "Public read studio docs"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'studio-documents');
