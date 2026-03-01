
-- Function to increment download count safely
CREATE OR REPLACE FUNCTION public.increment_download_count_if_exists(tid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.shop_templates
  SET download_count = download_count + 1
  WHERE id = tid;
END;
$$;
