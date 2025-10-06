-- Add contextual personalization fields to recipes table
ALTER TABLE recipes 
ADD COLUMN context_type text,
ADD COLUMN plating_guidance text,
ADD COLUMN time_management text,
ADD COLUMN ambiance_suggestions text,
ADD COLUMN leftover_tips text;