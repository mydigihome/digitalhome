
-- Collaborators / Team Invites table
CREATE TABLE public.collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  invited_email text NOT NULL,
  invited_user_id uuid,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('editor', 'viewer')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'declined')),
  project_ids uuid[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

-- Owner can manage their own invites
CREATE POLICY "Users can view own collaborators"
  ON public.collaborators FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = invited_user_id);

CREATE POLICY "Users can create invites"
  ON public.collaborators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collaborators"
  ON public.collaborators FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = invited_user_id);

CREATE POLICY "Users can delete own collaborators"
  ON public.collaborators FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_collaborators_updated_at
  BEFORE UPDATE ON public.collaborators
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Project templates table
CREATE TABLE public.project_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'personal',
  color text DEFAULT '#8B5CF6',
  tasks jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;

-- Templates are public read
CREATE POLICY "Anyone can view templates"
  ON public.project_templates FOR SELECT
  USING (true);

-- Seed some templates
INSERT INTO public.project_templates (name, description, type, color, tasks) VALUES
(
  'Home Renovation',
  'Plan and track your home renovation project from start to finish',
  'personal',
  '#3B82F6',
  '[{"title":"Research contractors","priority":"high","status":"backlog"},{"title":"Get 3 quotes","priority":"high","status":"backlog"},{"title":"Set budget","priority":"high","status":"backlog"},{"title":"Choose contractor","priority":"medium","status":"backlog"},{"title":"Order materials","priority":"medium","status":"backlog"},{"title":"Schedule inspections","priority":"low","status":"backlog"},{"title":"Final walkthrough","priority":"low","status":"backlog"}]'
),
(
  'Trip Planning',
  'Everything you need to plan the perfect trip',
  'travel',
  '#8B5CF6',
  '[{"title":"Choose destination","priority":"high","status":"backlog"},{"title":"Book flights","priority":"high","status":"backlog"},{"title":"Book accommodation","priority":"high","status":"backlog"},{"title":"Research activities","priority":"medium","status":"backlog"},{"title":"Pack essentials","priority":"medium","status":"backlog"},{"title":"Get travel insurance","priority":"low","status":"backlog"},{"title":"Create itinerary","priority":"medium","status":"backlog"}]'
),
(
  'Fitness Goal',
  'Track your fitness journey with structured milestones',
  'fitness',
  '#10B981',
  '[{"title":"Set measurable goals","priority":"high","status":"backlog"},{"title":"Create workout schedule","priority":"high","status":"backlog"},{"title":"Plan meal prep","priority":"medium","status":"backlog"},{"title":"Join gym or class","priority":"medium","status":"backlog"},{"title":"Track first week progress","priority":"medium","status":"backlog"},{"title":"Monthly check-in","priority":"low","status":"backlog"}]'
),
(
  'Course / Learning',
  'Structure your learning with clear milestones',
  'personal',
  '#F59E0B',
  '[{"title":"Define learning objectives","priority":"high","status":"backlog"},{"title":"Gather resources & materials","priority":"high","status":"backlog"},{"title":"Create study schedule","priority":"medium","status":"backlog"},{"title":"Complete Module 1","priority":"medium","status":"backlog"},{"title":"Complete Module 2","priority":"medium","status":"backlog"},{"title":"Practice exercises","priority":"medium","status":"backlog"},{"title":"Final review / assessment","priority":"low","status":"backlog"}]'
),
(
  'Product Launch',
  'Launch a product with marketing and go-to-market strategy',
  'work',
  '#EF4444',
  '[{"title":"Define target audience","priority":"high","status":"backlog"},{"title":"Create landing page","priority":"high","status":"backlog"},{"title":"Set up analytics","priority":"medium","status":"backlog"},{"title":"Write marketing copy","priority":"high","status":"backlog"},{"title":"Social media campaign","priority":"medium","status":"backlog"},{"title":"Email announcement","priority":"medium","status":"backlog"},{"title":"Launch day checklist","priority":"high","status":"backlog"},{"title":"Post-launch review","priority":"low","status":"backlog"}]'
);
