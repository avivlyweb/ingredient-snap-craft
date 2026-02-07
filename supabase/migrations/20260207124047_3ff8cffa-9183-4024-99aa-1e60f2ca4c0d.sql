-- Create food_logs table for voice-logged food intake
CREATE TABLE public.food_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    items TEXT[] NOT NULL DEFAULT '{}',
    meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    estimated_protein NUMERIC,
    estimated_calories NUMERIC,
    logged_via TEXT NOT NULL DEFAULT 'manual' CHECK (logged_via IN ('voice', 'manual')),
    transcript TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity_logs table for voice-logged physical activity
CREATE TABLE public.activity_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    duration_minutes INTEGER,
    intensity TEXT CHECK (intensity IN ('low', 'medium', 'high')),
    notes TEXT,
    logged_via TEXT NOT NULL DEFAULT 'manual' CHECK (logged_via IN ('voice', 'manual')),
    transcript TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create symptom_logs table for voice-logged symptoms with safety flags
CREATE TABLE public.symptom_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symptoms JSONB NOT NULL DEFAULT '{}',
    safety_flags TEXT[] DEFAULT '{}',
    ai_response TEXT,
    logged_via TEXT NOT NULL DEFAULT 'manual' CHECK (logged_via IN ('voice', 'manual')),
    transcript TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for food_logs
CREATE POLICY "Users can view their own food logs"
ON public.food_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own food logs"
ON public.food_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food logs"
ON public.food_logs
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food logs"
ON public.food_logs
FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for activity_logs
CREATE POLICY "Users can view their own activity logs"
ON public.activity_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity logs"
ON public.activity_logs
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activity logs"
ON public.activity_logs
FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for symptom_logs
CREATE POLICY "Users can view their own symptom logs"
ON public.symptom_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own symptom logs"
ON public.symptom_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own symptom logs"
ON public.symptom_logs
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own symptom logs"
ON public.symptom_logs
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for efficient querying
CREATE INDEX idx_food_logs_user_date ON public.food_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_logs_user_date ON public.activity_logs(user_id, created_at DESC);
CREATE INDEX idx_symptom_logs_user_date ON public.symptom_logs(user_id, created_at DESC);
CREATE INDEX idx_symptom_logs_safety ON public.symptom_logs USING GIN(safety_flags);