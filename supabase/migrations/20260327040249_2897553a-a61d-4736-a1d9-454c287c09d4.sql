-- Add Digi Home columns to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS digihome_user_id uuid;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS digihome_connection_type text;

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for avatars bucket
CREATE POLICY "Users upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Auto-add digihome contact function
CREATE OR REPLACE FUNCTION public.auto_add_digihome_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  collab_email text;
  collab_name text;
BEGIN
  collab_email := NEW.invited_email;
  
  IF NEW.invited_user_id IS NOT NULL THEN
    SELECT full_name INTO collab_name FROM public.profiles WHERE id = NEW.invited_user_id;
  END IF;
  
  IF collab_name IS NULL THEN
    collab_name := split_part(collab_email, '@', 1);
  END IF;

  INSERT INTO public.contacts (user_id, name, email, relationship_type, imported_from, digihome_user_id, digihome_connection_type)
  VALUES (NEW.user_id, collab_name, collab_email, 'digihome', 'digihome', NEW.invited_user_id, 'project_collaborator')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create trigger on collaborators table
DROP TRIGGER IF EXISTS trg_auto_add_digihome_contact ON public.collaborators;
CREATE TRIGGER trg_auto_add_digihome_contact
AFTER INSERT ON public.collaborators
FOR EACH ROW
EXECUTE FUNCTION public.auto_add_digihome_contact();