
-- Fix: Remove overly permissive INSERT policies and replace with scoped ones
DROP POLICY "Allow insert from service role" ON public.template_purchases;
DROP POLICY "Anyone can insert downloads" ON public.template_downloads;

-- Purchases: only authenticated users or service role can insert
CREATE POLICY "Authenticated users can record purchases"
ON public.template_purchases FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Downloads: authenticated users track own downloads
CREATE POLICY "Authenticated users track downloads"
ON public.template_downloads FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
