-- Add wearable-free activity tracking columns to activity_logs
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS movement_moments integer;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS longest_sitting_streak_min integer;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS perceived_exertion_rpe integer;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS fatigue_score integer;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS pain_score integer;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS sleep_hours numeric;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS activity_state text;

-- Add comments for clarity
COMMENT ON COLUMN public.activity_logs.movement_moments IS 'Number of times patient got up and moved 2+ minutes';
COMMENT ON COLUMN public.activity_logs.longest_sitting_streak_min IS 'Longest uninterrupted sitting period in minutes';
COMMENT ON COLUMN public.activity_logs.perceived_exertion_rpe IS 'Rate of Perceived Exertion 0-10 scale';
COMMENT ON COLUMN public.activity_logs.fatigue_score IS 'Fatigue level 0-10';
COMMENT ON COLUMN public.activity_logs.pain_score IS 'Pain level 0-10';
COMMENT ON COLUMN public.activity_logs.sleep_hours IS 'Hours of sleep last night';
COMMENT ON COLUMN public.activity_logs.activity_state IS 'Calculated state: ADEQUATE, UNDERSTIMULATED, STALLING, FATIGUE_LIMITED, OVERREACHED, DATA_SPARSE';

-- Add recovery settings to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cognitive_light_mode boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS surgery_date date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS recovery_status text DEFAULT 'post_op';

-- Add comments for clarity
COMMENT ON COLUMN public.profiles.cognitive_light_mode IS 'Simplified UI mode for patients with brain fog/chemo brain';
COMMENT ON COLUMN public.profiles.surgery_date IS 'Date of surgery for post-op week calculation (Graduated Recovery Protocol)';
COMMENT ON COLUMN public.profiles.recovery_status IS 'Current recovery phase: pre_op, post_op, chemotherapy';