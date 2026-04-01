-- Drop and recreate food_logs check constraints with expanded values
ALTER TABLE public.food_logs DROP CONSTRAINT food_logs_logged_via_check;
ALTER TABLE public.food_logs ADD CONSTRAINT food_logs_logged_via_check 
  CHECK (logged_via = ANY (ARRAY['voice'::text, 'manual'::text, 'recipe'::text, 'cognitive_light_mode'::text]));

ALTER TABLE public.food_logs DROP CONSTRAINT food_logs_data_source_check;
ALTER TABLE public.food_logs ADD CONSTRAINT food_logs_data_source_check 
  CHECK (data_source = ANY (ARRAY['patient_reported'::text, 'nevo_lookup'::text, 'recipe_generated'::text]));

-- Drop and recreate activity_logs check constraints with expanded values
ALTER TABLE public.activity_logs DROP CONSTRAINT activity_logs_logged_via_check;
ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_logged_via_check 
  CHECK (logged_via = ANY (ARRAY['voice'::text, 'manual'::text, 'cognitive_light_mode'::text]));
