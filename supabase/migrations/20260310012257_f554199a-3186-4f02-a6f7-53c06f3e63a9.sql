
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS content_planner_access BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS religion TEXT,
ADD COLUMN IF NOT EXISTS show_scripture_card BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS banner_color TEXT DEFAULT '#6366F1';
