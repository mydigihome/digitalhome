
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Other',
  resource_type TEXT NOT NULL DEFAULT 'link',
  url TEXT,
  file_url TEXT,
  thumbnail_url TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published resources"
ON public.resources
FOR SELECT
TO authenticated
USING (published = true);

CREATE POLICY "Creator can view own resources"
ON public.resources
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Creator can insert own resources"
ON public.resources
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creator can update own resources"
ON public.resources
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Creator can delete own resources"
ON public.resources
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
