
CREATE POLICY "Authenticated users can upload to ad-creatives"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ad-creatives');

CREATE POLICY "Authenticated users can update ad-creatives"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ad-creatives');

CREATE POLICY "Public can read ad-creatives"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ad-creatives');
