
-- Track clicks and signups for AI resources/integrations
CREATE TABLE public.resource_engagements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id integer NOT NULL,
  resource_name text NOT NULL,
  engagement_type text NOT NULL CHECK (engagement_type IN ('click', 'signup')),
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resource_engagements ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert their own engagement
CREATE POLICY "Users can record own engagements"
ON public.resource_engagements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Anyone can read aggregate counts (needed for displaying stats)
CREATE POLICY "Anyone authenticated can view engagements"
ON public.resource_engagements
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Index for fast aggregation
CREATE INDEX idx_resource_engagements_resource ON public.resource_engagements(resource_id, engagement_type);
