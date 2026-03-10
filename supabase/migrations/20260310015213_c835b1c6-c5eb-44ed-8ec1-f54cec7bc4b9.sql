
-- Add new columns to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS content_planner_is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS signup_number INTEGER,
ADD COLUMN IF NOT EXISTS template_notifications BOOLEAN DEFAULT false;

-- Function to grant early access to first 50 users
CREATE OR REPLACE FUNCTION public.grant_early_access() 
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  SELECT COUNT(*) + 1 INTO NEW.signup_number FROM public.user_preferences;
  IF NEW.signup_number <= 50 THEN
    NEW.content_planner_access = true;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for auto-granting early access
DROP TRIGGER IF EXISTS set_signup_number ON public.user_preferences;
CREATE TRIGGER set_signup_number 
BEFORE INSERT ON public.user_preferences
FOR EACH ROW EXECUTE FUNCTION public.grant_early_access();
