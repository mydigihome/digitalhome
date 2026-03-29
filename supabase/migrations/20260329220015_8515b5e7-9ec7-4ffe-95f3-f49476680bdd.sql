
CREATE TABLE IF NOT EXISTS studio_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  brand_name text NOT NULL,
  brand_type text DEFAULT 'personal',
  brand_color text DEFAULT '#6366f1',
  avatar_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE studio_brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their brands" ON studio_brands FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS social_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  connection_id uuid REFERENCES social_connections ON DELETE CASCADE,
  platform text NOT NULL,
  platform_comment_id text,
  commenter_username text,
  commenter_avatar text,
  comment_text text,
  post_id text,
  post_caption_snippet text,
  is_read boolean DEFAULT false,
  commented_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE social_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their comments" ON social_comments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE social_connections ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES studio_brands ON DELETE CASCADE;
ALTER TABLE social_connections ADD COLUMN IF NOT EXISTS total_reach_30d integer DEFAULT 0;
ALTER TABLE social_connections ADD COLUMN IF NOT EXISTS total_interactions_30d integer DEFAULT 0;
ALTER TABLE social_connections ADD COLUMN IF NOT EXISTS avg_engagement_rate numeric DEFAULT 0;

ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS connection_id uuid REFERENCES social_connections ON DELETE CASCADE;

ALTER TABLE brand_deals ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE brand_deals ADD COLUMN IF NOT EXISTS payout_status text DEFAULT 'unpaid';
ALTER TABLE brand_deals ADD COLUMN IF NOT EXISTS payout_amount numeric;
ALTER TABLE brand_deals ADD COLUMN IF NOT EXISTS payout_date timestamptz;

ALTER TABLE content_pieces ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES studio_brands ON DELETE CASCADE;
