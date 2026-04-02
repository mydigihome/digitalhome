
-- Content items table for the pipeline
CREATE TABLE public.content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  studio_id uuid,
  title text NOT NULL,
  platform text,
  content_type text,
  stage text DEFAULT 'idea',
  due_date date,
  assigned_to uuid,
  caption_notes text,
  comment_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own content items" ON public.content_items
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Studio collaborators
CREATE TABLE public.studio_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_owner_id uuid NOT NULL,
  collaborator_id uuid,
  collaborator_email text,
  role text DEFAULT 'editor',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.studio_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage collaborators" ON public.studio_collaborators
  FOR ALL USING (auth.uid() = studio_owner_id)
  WITH CHECK (auth.uid() = studio_owner_id);

-- Studio invites
CREATE TABLE public.studio_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_user_id uuid NOT NULL,
  invitee_email text NOT NULL,
  studio_name text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.studio_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own invites" ON public.studio_invites
  FOR ALL USING (auth.uid() = inviter_user_id)
  WITH CHECK (auth.uid() = inviter_user_id);

-- Enable realtime on content_items
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_items;
