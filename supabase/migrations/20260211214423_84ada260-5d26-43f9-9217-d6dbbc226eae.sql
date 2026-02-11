ALTER TABLE brain_dumps ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE brain_dumps ADD COLUMN IF NOT EXISTS structured_data JSONB;
-- ai_title already exists from previous migration, but just in case:
ALTER TABLE brain_dumps ADD COLUMN IF NOT EXISTS ai_title TEXT;