
-- Add source tracking columns to calendar_events
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_locally boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_locally boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS synced_at timestamp with time zone;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_deleted_locally ON public.calendar_events(deleted_locally);
CREATE INDEX IF NOT EXISTS idx_calendar_events_source ON public.calendar_events(source);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_start ON public.calendar_events(user_id, start_time);
