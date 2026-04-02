ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS event_date date;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS partiful_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS host_name text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description text;