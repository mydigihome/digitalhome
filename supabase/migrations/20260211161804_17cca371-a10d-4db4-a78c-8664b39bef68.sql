
-- Drop existing overly permissive storage policies
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view project documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete project documents" ON storage.objects;

-- Create owner-scoped SELECT policy
CREATE POLICY "Users can view own project documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'project-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create owner-scoped DELETE policy
CREATE POLICY "Users can delete own project documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Also tighten INSERT policy to use path-based ownership
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload project documents" ON storage.objects;

CREATE POLICY "Users can upload own project documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
