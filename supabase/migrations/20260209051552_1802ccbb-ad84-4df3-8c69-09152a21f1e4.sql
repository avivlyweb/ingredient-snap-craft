-- Enable realtime for the health logging tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.food_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.symptom_logs;