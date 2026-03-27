ALTER TABLE projects ADD COLUMN IF NOT EXISTS financial_goal numeric DEFAULT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS financial_goal_set_by text DEFAULT 'ai';