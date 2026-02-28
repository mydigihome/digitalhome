
ALTER TABLE public.ninety_day_goals
  ADD COLUMN IF NOT EXISTS display_format jsonb NOT NULL DEFAULT '{"showWeeks":true,"showDays":true,"showHours":true,"showMinutes":false,"showSeconds":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS font_style text NOT NULL DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS text_color text NOT NULL DEFAULT '#FFFFFF',
  ADD COLUMN IF NOT EXISTS transparency_level integer NOT NULL DEFAULT 20;
