-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by everyone
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add user ownership columns to recipes table
ALTER TABLE public.recipes 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN username TEXT,
ADD COLUMN user_avatar TEXT,
ADD COLUMN is_public BOOLEAN DEFAULT true NOT NULL;

-- Update existing recipes to be public (for migration)
UPDATE public.recipes SET is_public = true WHERE is_public IS NULL;

-- Create recipe_likes table
CREATE TABLE public.recipe_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(recipe_id, user_id)
);

-- Enable RLS on recipe_likes
ALTER TABLE public.recipe_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can view likes
CREATE POLICY "Anyone can view likes" 
ON public.recipe_likes 
FOR SELECT 
USING (true);

-- Authenticated users can like recipes
CREATE POLICY "Authenticated users can like recipes" 
ON public.recipe_likes 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can unlike recipes
CREATE POLICY "Users can unlike recipes" 
ON public.recipe_likes 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Update recipes RLS policies
DROP POLICY IF EXISTS "Anyone can view recipes" ON public.recipes;
DROP POLICY IF EXISTS "Anyone can create recipes" ON public.recipes;

-- Anyone can view public recipes
CREATE POLICY "Anyone can view public recipes" 
ON public.recipes 
FOR SELECT 
USING (is_public = true OR auth.uid() = user_id);

-- Authenticated users can create recipes
CREATE POLICY "Authenticated users can create recipes" 
ON public.recipes 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own recipes
CREATE POLICY "Users can update their own recipes" 
ON public.recipes 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own recipes
CREATE POLICY "Users can delete their own recipes" 
ON public.recipes 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  username_base TEXT;
  username_final TEXT;
  username_counter INTEGER := 0;
BEGIN
  -- Extract username from email or use 'user'
  username_base := COALESCE(
    split_part(NEW.email, '@', 1),
    'user'
  );
  
  -- Remove special characters and make lowercase
  username_base := lower(regexp_replace(username_base, '[^a-zA-Z0-9]', '', 'g'));
  
  -- Ensure username is not empty
  IF username_base = '' THEN
    username_base := 'user';
  END IF;
  
  username_final := username_base;
  
  -- Handle username uniqueness by appending numbers
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = username_final) LOOP
    username_counter := username_counter + 1;
    username_final := username_base || username_counter;
  END LOOP;
  
  -- Insert profile
  INSERT INTO public.profiles (user_id, username, avatar_url)
  VALUES (
    NEW.id,
    username_final,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add trigger for profile updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();