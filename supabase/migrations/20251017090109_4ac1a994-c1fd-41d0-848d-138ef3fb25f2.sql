-- Allow anonymous users to create public recipes
CREATE POLICY "Anonymous users can create public recipes"
ON public.recipes
FOR INSERT
WITH CHECK (user_id IS NULL AND is_public = true);

-- Update select policy to show all public recipes
DROP POLICY IF EXISTS "Anyone can view public recipes" ON public.recipes;

CREATE POLICY "Anyone can view public recipes"
ON public.recipes
FOR SELECT
USING (is_public = true OR auth.uid() = user_id);