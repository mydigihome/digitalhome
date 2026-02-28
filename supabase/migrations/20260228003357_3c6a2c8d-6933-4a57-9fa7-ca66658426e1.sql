
-- Event details table linked to projects
CREATE TABLE public.event_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  event_date timestamp with time zone,
  location text,
  location_type text NOT NULL DEFAULT 'physical',
  description text,
  rsvp_deadline timestamp with time zone,
  privacy text NOT NULL DEFAULT 'private',
  share_token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  event_type text NOT NULL DEFAULT 'other',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Event guests table
CREATE TABLE public.event_guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.event_details(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  status text NOT NULL DEFAULT 'pending',
  viewed_at timestamp with time zone,
  rsvp_at timestamp with time zone,
  rsvp_answers jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Event RSVP custom questions
CREATE TABLE public.event_rsvp_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.event_details(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'text',
  position integer NOT NULL DEFAULT 0
);

-- Goal stages table for structured goal tracking
CREATE TABLE public.goal_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Goal tasks linked to stages
CREATE TABLE public.goal_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES public.goal_stages(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Project resources (files/links for both events & goals)
CREATE TABLE public.project_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text,
  file_path text,
  resource_type text NOT NULL DEFAULT 'link',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.event_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvp_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_resources ENABLE ROW LEVEL SECURITY;

-- Event details: owner access via project ownership
CREATE POLICY "Users manage own event details"
ON public.event_details FOR ALL
USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = event_details.project_id AND projects.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = event_details.project_id AND projects.user_id = auth.uid()));

-- Event guests: owner access + public read by share_token (handled via edge function)
CREATE POLICY "Users manage own event guests"
ON public.event_guests FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.event_details ed
  JOIN public.projects p ON p.id = ed.project_id
  WHERE ed.id = event_guests.event_id AND p.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.event_details ed
  JOIN public.projects p ON p.id = ed.project_id
  WHERE ed.id = event_guests.event_id AND p.user_id = auth.uid()
));

-- RSVP questions: owner access
CREATE POLICY "Users manage own rsvp questions"
ON public.event_rsvp_questions FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.event_details ed
  JOIN public.projects p ON p.id = ed.project_id
  WHERE ed.id = event_rsvp_questions.event_id AND p.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.event_details ed
  JOIN public.projects p ON p.id = ed.project_id
  WHERE ed.id = event_rsvp_questions.event_id AND p.user_id = auth.uid()
));

-- Goal stages: owner access
CREATE POLICY "Users manage own goal stages"
ON public.goal_stages FOR ALL
USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = goal_stages.project_id AND projects.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = goal_stages.project_id AND projects.user_id = auth.uid()));

-- Goal tasks: owner access
CREATE POLICY "Users manage own goal tasks"
ON public.goal_tasks FOR ALL
USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = goal_tasks.project_id AND projects.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = goal_tasks.project_id AND projects.user_id = auth.uid()));

-- Project resources: owner access
CREATE POLICY "Users manage own project resources"
ON public.project_resources FOR ALL
USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_resources.project_id AND projects.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_resources.project_id AND projects.user_id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_event_details_updated_at
BEFORE UPDATE ON public.event_details
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
