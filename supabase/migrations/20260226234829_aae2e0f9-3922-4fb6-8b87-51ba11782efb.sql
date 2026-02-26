
-- Create a table to store content planner data as JSON per user
CREATE TABLE public.content_planner_data (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.content_planner_data ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users manage own content planner data"
  ON public.content_planner_data
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER update_content_planner_data_updated_at
  BEFORE UPDATE ON public.content_planner_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
