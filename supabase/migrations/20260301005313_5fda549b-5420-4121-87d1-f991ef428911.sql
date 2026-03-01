
-- Create storage bucket for template files (private - signed URLs for downloads)
INSERT INTO storage.buckets (id, name, public) VALUES ('template-files', 'template-files', false);

-- Create storage bucket for template preview images (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('template-previews', 'template-previews', true);

-- Storage policies for template-previews (public read, admin write)
CREATE POLICY "Template previews are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'template-previews');

CREATE POLICY "Admins can upload template previews"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'template-previews' AND public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can update template previews"
ON storage.objects FOR UPDATE
USING (bucket_id = 'template-previews' AND public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can delete template previews"
ON storage.objects FOR DELETE
USING (bucket_id = 'template-previews' AND public.has_role(auth.uid(), 'super_admin'));

-- Storage policies for template-files (signed URL download, admin write)
CREATE POLICY "Admins can upload template files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'template-files' AND public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can update template files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'template-files' AND public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can delete template files"
ON storage.objects FOR DELETE
USING (bucket_id = 'template-files' AND public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can download template files"
ON storage.objects FOR SELECT
USING (bucket_id = 'template-files');

-- Templates table
CREATE TABLE public.shop_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL DEFAULT 'resume',
  preview_image_url TEXT,
  file_url TEXT,
  pdf_url TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_in_bundle BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  stripe_price_id TEXT,
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_templates ENABLE ROW LEVEL SECURITY;

-- Public read for active templates
CREATE POLICY "Anyone can view active templates"
ON public.shop_templates FOR SELECT
USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins manage templates"
ON public.shop_templates FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Template purchases table
CREATE TABLE public.template_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.shop_templates(id) ON DELETE SET NULL,
  user_id UUID,
  buyer_email TEXT NOT NULL,
  stripe_payment_id TEXT,
  stripe_session_id TEXT,
  amount_paid INTEGER NOT NULL DEFAULT 0,
  is_bundle BOOLEAN NOT NULL DEFAULT false,
  download_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  token_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.template_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view own purchases
CREATE POLICY "Users view own purchases"
ON public.template_purchases FOR SELECT
USING (auth.uid() = user_id);

-- Admin full access
CREATE POLICY "Admins manage purchases"
ON public.template_purchases FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Service role inserts (for edge functions)
CREATE POLICY "Allow insert from service role"
ON public.template_purchases FOR INSERT
WITH CHECK (true);

-- Template downloads tracking
CREATE TABLE public.template_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.shop_templates(id) ON DELETE SET NULL,
  user_id UUID,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.template_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert downloads"
ON public.template_downloads FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins view downloads"
ON public.template_downloads FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users view own downloads"
ON public.template_downloads FOR SELECT
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_shop_templates_updated_at
BEFORE UPDATE ON public.shop_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
