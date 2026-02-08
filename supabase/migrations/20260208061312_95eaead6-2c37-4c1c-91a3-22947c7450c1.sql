-- Add step_count column to activity_logs
ALTER TABLE public.activity_logs 
ADD COLUMN step_count integer DEFAULT NULL;

-- Add suggested_action column to symptom_logs for AI recommendations
ALTER TABLE public.symptom_logs 
ADD COLUMN suggested_action text DEFAULT NULL;

-- Add sleep_quality column to symptom_logs for fatigue correlation
ALTER TABLE public.symptom_logs 
ADD COLUMN sleep_quality integer DEFAULT NULL CHECK (sleep_quality >= 1 AND sleep_quality <= 10);

-- Add confidence and data source columns to food_logs for adherence gap tracking
ALTER TABLE public.food_logs 
ADD COLUMN protein_confidence text DEFAULT NULL CHECK (protein_confidence IN ('low', 'medium', 'high'));

ALTER TABLE public.food_logs 
ADD COLUMN data_source text DEFAULT 'patient_reported' CHECK (data_source IN ('patient_reported', 'nevo_lookup'));