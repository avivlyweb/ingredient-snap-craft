-- Create storage bucket for recipe images
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow anyone to view recipe images
CREATE POLICY "Recipe images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'recipe-images');

-- Create policy to allow authenticated users to upload recipe images
CREATE POLICY "Authenticated users can upload recipe images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'recipe-images');

-- Create policy to allow service role to manage recipe images (for edge functions)
CREATE POLICY "Service role can manage recipe images"
ON storage.objects FOR ALL
USING (bucket_id = 'recipe-images');