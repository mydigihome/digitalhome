
CREATE TABLE IF NOT EXISTS public.social_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL,
  access_token text,
  refresh_token text,
  platform_user_id text,
  platform_username text,
  platform_avatar_url text,
  follower_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  post_count integer DEFAULT 0,
  expires_at timestamptz,
  connected_at timestamptz DEFAULT now(),
  last_synced timestamptz,
  UNIQUE(user_id, platform)
);
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their connections" ON public.social_connections FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.content_pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  caption text,
  hashtags text[],
  media_urls text[],
  platforms text[],
  status text DEFAULT 'idea',
  assigned_to uuid,
  scheduled_for timestamptz,
  notes text,
  ai_caption text,
  ai_hashtags text[],
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.content_pieces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage content pieces" ON public.content_pieces FOR ALL USING (auth.uid() = user_id OR auth.uid() = assigned_to) WITH CHECK (auth.uid() = user_id OR auth.uid() = assigned_to);

CREATE TABLE IF NOT EXISTS public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL,
  platform_post_id text,
  content_piece_id uuid REFERENCES public.content_pieces(id) ON DELETE SET NULL,
  caption text,
  media_urls text[],
  post_type text,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  saves integer DEFAULT 0,
  reach integer DEFAULT 0,
  impressions integer DEFAULT 0,
  engagement_rate numeric,
  posted_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their posts" ON public.social_posts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.content_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_piece_id uuid REFERENCES public.content_pieces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.content_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage comments" ON public.content_comments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.brand_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  brand_name text NOT NULL,
  contact_name text,
  contact_email text,
  deal_value numeric,
  deal_type text,
  platforms text[],
  deliverables text,
  deadline timestamptz,
  status text DEFAULT 'outreach',
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.brand_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their deals" ON public.brand_deals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.revenue_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL,
  platform text,
  amount numeric NOT NULL,
  description text,
  received_at date,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.revenue_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their revenue" ON public.revenue_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
