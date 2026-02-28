
-- Add new columns to resumes table for tags, starring, and tracking
ALTER TABLE public.resumes
  ADD COLUMN tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN is_starred boolean NOT NULL DEFAULT false,
  ADD COLUMN last_sent_date timestamp with time zone DEFAULT NULL;
