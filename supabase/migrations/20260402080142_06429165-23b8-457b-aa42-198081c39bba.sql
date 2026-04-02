ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS followup_cadence integer;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS birthday date;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS location text;