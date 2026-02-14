
-- Announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_roles TEXT[] DEFAULT ARRAY['student', 'main_account', 'moderator'],
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin manages announcements" ON public.announcements
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users see active announcements" ON public.announcements
  FOR SELECT TO authenticated
  USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Feature flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin manages feature flags" ON public.feature_flags
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "All users can view feature flags" ON public.feature_flags
  FOR SELECT TO authenticated
  USING (true);

-- Add some default feature flags
INSERT INTO public.feature_flags (feature_name, description, is_enabled) VALUES
  ('brain_dump', 'Brain Dump feature', true),
  ('vision_board', 'Vision Board feature', true),
  ('wealth_tracker', 'Wealth Tracker feature', true),
  ('ai_task_generator', 'AI Task Generator', true),
  ('college_applications', 'College Applications tracker', true)
ON CONFLICT (feature_name) DO NOTHING;
