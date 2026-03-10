
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  title TEXT,
  photo_url TEXT,
  relationship_type TEXT,
  last_contacted_date TIMESTAMPTZ,
  contact_frequency_days INTEGER DEFAULT 30,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contacts" ON public.contacts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_contacts_user ON public.contacts(user_id);

CREATE TABLE public.contact_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  interaction_type TEXT,
  interaction_date TIMESTAMPTZ DEFAULT NOW(),
  title TEXT,
  description TEXT
);

ALTER TABLE public.contact_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own interactions" ON public.contact_interactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
