
-- Add card_color and card_opacity to notes table
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS card_color TEXT DEFAULT '#8B5CF6';
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS card_opacity INTEGER DEFAULT 92;

-- Add card_opacity to brain_dumps table
ALTER TABLE public.brain_dumps ADD COLUMN IF NOT EXISTS card_opacity INTEGER DEFAULT 92;
