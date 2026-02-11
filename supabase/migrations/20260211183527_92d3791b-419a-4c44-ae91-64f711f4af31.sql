
-- Add icon and cover columns to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS icon_type TEXT DEFAULT 'emoji';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS cover_type TEXT DEFAULT 'none';

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  dashboard_icon TEXT,
  dashboard_icon_type TEXT DEFAULT 'emoji',
  dashboard_cover TEXT,
  dashboard_cover_type TEXT DEFAULT 'none',
  theme_color TEXT DEFAULT '#8B5CF6',
  accent_colors JSONB,
  profile_photo TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  sidebar_theme TEXT DEFAULT 'light',
  font_size TEXT DEFAULT 'medium',
  density TEXT DEFAULT 'comfortable',
  custom_folder_colors BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Users manage own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Updated at trigger
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for profile photos and covers
INSERT INTO storage.buckets (id, name, public) VALUES ('user-assets', 'user-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user-assets bucket
CREATE POLICY "Users can upload own assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'user-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own assets" ON storage.objects
  FOR UPDATE USING (bucket_id = 'user-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own assets" ON storage.objects
  FOR DELETE USING (bucket_id = 'user-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read user assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-assets');
