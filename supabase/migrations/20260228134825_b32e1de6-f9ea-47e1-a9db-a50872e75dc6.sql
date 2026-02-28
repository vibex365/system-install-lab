
-- Create storage bucket for social post images
INSERT INTO storage.buckets (id, name, public) VALUES ('social-images', 'social-images', true);

-- Allow authenticated users to upload
CREATE POLICY "Admins can upload social images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'social-images'
  AND public.has_role(auth.uid(), 'chief_architect'::public.app_role)
);

-- Allow public read
CREATE POLICY "Public can view social images"
ON storage.objects FOR SELECT
USING (bucket_id = 'social-images');

-- Allow admins to delete
CREATE POLICY "Admins can delete social images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'social-images'
  AND public.has_role(auth.uid(), 'chief_architect'::public.app_role)
);

-- Allow admins to update
CREATE POLICY "Admins can update social images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'social-images'
  AND public.has_role(auth.uid(), 'chief_architect'::public.app_role)
);
