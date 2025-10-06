-- Create recipes table for storing generated recipes
CREATE TABLE public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  ingredients TEXT[] NOT NULL,
  steps TEXT NOT NULL,
  cuisine_style TEXT,
  serving_suggestion TEXT,
  image_url TEXT,
  ingredient_images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view recipes (public gallery)
CREATE POLICY "Anyone can view recipes"
ON public.recipes
FOR SELECT
USING (true);

-- Create policy to allow anyone to create recipes (no auth required for MVP)
CREATE POLICY "Anyone can create recipes"
ON public.recipes
FOR INSERT
WITH CHECK (true);

-- Create storage bucket for uploaded ingredient images
INSERT INTO storage.buckets (id, name, public)
VALUES ('ingredient-images', 'ingredient-images', true);

-- Create policy to allow anyone to upload images
CREATE POLICY "Anyone can upload ingredient images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'ingredient-images');

-- Create policy to allow anyone to view images
CREATE POLICY "Anyone can view ingredient images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ingredient-images');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_recipes_updated_at
BEFORE UPDATE ON public.recipes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();