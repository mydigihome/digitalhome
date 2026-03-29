
CREATE TABLE IF NOT EXISTS studio_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  brand_id uuid REFERENCES studio_brands ON DELETE CASCADE,
  idea text NOT NULL,
  platform text,
  content_type text,
  status text DEFAULT 'idea',
  promoted_to_content boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE studio_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their ideas" ON studio_ideas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS studio_strategy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  brand_id uuid REFERENCES studio_brands ON DELETE CASCADE,
  primary_goals text,
  target_audience text,
  competitor_analysis text,
  brand_voice text,
  content_pillars text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, brand_id)
);
ALTER TABLE studio_strategy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their strategy" ON studio_strategy FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
