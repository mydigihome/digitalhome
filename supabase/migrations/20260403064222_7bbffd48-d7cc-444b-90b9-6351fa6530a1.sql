ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS billing_cycle text default 'monthly';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS annual_start_date timestamptz;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS studio_unlocked boolean default false;