
-- Waitlist table
CREATE TABLE public.content_planner_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  user_id UUID,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  notified BOOLEAN DEFAULT false
);

CREATE INDEX idx_waitlist_email ON public.content_planner_waitlist(email);
CREATE INDEX idx_waitlist_requested ON public.content_planner_waitlist(requested_at DESC);

ALTER TABLE public.content_planner_waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert themselves
CREATE POLICY "Users can join waitlist"
ON public.content_planner_waitlist
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can view their own waitlist entry
CREATE POLICY "Users can view own waitlist entry"
ON public.content_planner_waitlist
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Super admin can manage all waitlist entries
CREATE POLICY "Super admin manages waitlist"
ON public.content_planner_waitlist
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- App settings table
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read settings
CREATE POLICY "Anyone can read app settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (true);

-- Only super admin can modify settings
CREATE POLICY "Super admin manages settings"
ON public.app_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Insert default video setting
INSERT INTO public.app_settings (key, value) VALUES ('content_planner_preview_video', '');
