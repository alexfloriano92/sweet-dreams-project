
CREATE POLICY "logos owner read"   ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "logos owner write"  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "logos owner update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "logos owner delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
