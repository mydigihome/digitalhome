
-- Caption Ideas table
CREATE TABLE public.content_caption_ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  caption_text TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.content_caption_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own caption ideas" ON public.content_caption_ideas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Brand Collaborations table
CREATE TABLE public.brand_collaborations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_name TEXT NOT NULL DEFAULT '',
  contact_name TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Reached Out',
  deal_value NUMERIC DEFAULT 0,
  campaign_start DATE,
  campaign_end DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.brand_collaborations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own brand collabs" ON public.brand_collaborations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
