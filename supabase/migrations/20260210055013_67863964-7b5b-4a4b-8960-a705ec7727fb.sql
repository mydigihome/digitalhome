
-- Add new task fields for enhanced task management
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS duration integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS min_chunk integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS assignee text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS labels text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS blocked_by uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS auto_scheduled boolean DEFAULT false;
