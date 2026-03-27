
CREATE TABLE IF NOT EXISTS public.linkedin_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  access_token text NOT NULL,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.linkedin_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their linkedin tokens" ON public.linkedin_tokens FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.priority_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  season text DEFAULT 'Q1 2026',
  value_proposition text,
  recommended_frequency integer DEFAULT 14,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, contact_id)
);
ALTER TABLE public.priority_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their priority contacts" ON public.priority_contacts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.contact_project_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  relevance_reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(contact_id, project_id)
);
ALTER TABLE public.contact_project_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their contact links" ON public.contact_project_links FOR ALL USING (
  EXISTS (SELECT 1 FROM public.contacts WHERE contacts.id = contact_id AND contacts.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.contacts WHERE contacts.id = contact_id AND contacts.user_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS public.priority_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  gmail_message_id text UNIQUE,
  thread_id text,
  subject text,
  snippet text,
  body text,
  from_email text,
  received_at timestamptz,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.priority_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their priority emails" ON public.priority_emails FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS imported_from text,
  ADD COLUMN IF NOT EXISTS last_email_date timestamptz,
  ADD COLUMN IF NOT EXISTS email_count integer DEFAULT 0;
