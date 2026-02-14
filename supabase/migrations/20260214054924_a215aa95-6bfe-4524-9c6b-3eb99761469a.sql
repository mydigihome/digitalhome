
-- Add user_number (auto-incrementing signup order) and founding_member flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_number serial;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS founding_member boolean NOT NULL DEFAULT false;

-- Backfill existing users: assign user_number by created_at order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM public.profiles
)
UPDATE public.profiles p
SET user_number = n.rn
FROM numbered n
WHERE p.id = n.id;

-- Mark first 50 as founding members
UPDATE public.profiles
SET founding_member = true
WHERE user_number <= 50;

-- Create trigger to auto-assign user_number and founding_member on new profile insert
CREATE OR REPLACE FUNCTION public.assign_founding_member()
RETURNS TRIGGER AS $$
DECLARE
  next_num integer;
BEGIN
  -- Get the next user number
  SELECT COALESCE(MAX(user_number), 0) + 1 INTO next_num FROM public.profiles;
  NEW.user_number := next_num;
  IF next_num <= 50 THEN
    NEW.founding_member := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_assign_founding_member
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.assign_founding_member();
