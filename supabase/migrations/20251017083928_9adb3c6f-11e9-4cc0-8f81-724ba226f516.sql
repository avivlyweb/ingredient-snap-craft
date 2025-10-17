-- Create NEVO foods table with nutritional data
CREATE TABLE IF NOT EXISTS public.nevo_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nevo_code TEXT UNIQUE NOT NULL,
  food_name_nl TEXT NOT NULL,
  food_name_en TEXT NOT NULL,
  
  -- Core macronutrients (per 100g)
  energy_kj NUMERIC,
  energy_kcal NUMERIC,
  water_total NUMERIC,
  protein_total NUMERIC,
  protein_plant NUMERIC,
  protein_animal NUMERIC,
  fat_total NUMERIC,
  carbohydrate_available NUMERIC,
  fiber_dietary_total NUMERIC,
  alcohol_total NUMERIC,
  
  -- Fatty acids
  fatty_acids_saturated NUMERIC,
  fatty_acids_monounsaturated NUMERIC,
  fatty_acids_polyunsaturated NUMERIC,
  
  -- Key micronutrients
  vitamin_a NUMERIC,
  vitamin_d NUMERIC,
  vitamin_e NUMERIC,
  vitamin_k NUMERIC,
  vitamin_b1 NUMERIC,
  vitamin_b2 NUMERIC,
  vitamin_b6 NUMERIC,
  vitamin_b12 NUMERIC,
  vitamin_c NUMERIC,
  folate NUMERIC,
  
  -- Minerals
  calcium NUMERIC,
  iron NUMERIC,
  magnesium NUMERIC,
  phosphorus NUMERIC,
  potassium NUMERIC,
  sodium NUMERIC,
  zinc NUMERIC,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast lookups
CREATE INDEX idx_nevo_foods_name_en ON public.nevo_foods(food_name_en);
CREATE INDEX idx_nevo_foods_name_nl ON public.nevo_foods(food_name_nl);
CREATE INDEX idx_nevo_foods_code ON public.nevo_foods(nevo_code);

-- Enable RLS
ALTER TABLE public.nevo_foods ENABLE ROW LEVEL SECURITY;

-- Allow public read access to NEVO data
CREATE POLICY "NEVO foods are viewable by everyone"
ON public.nevo_foods FOR SELECT
USING (true);

-- Create storage bucket for NEVO data files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('nevo-data', 'nevo-data', false)
ON CONFLICT (id) DO NOTHING;