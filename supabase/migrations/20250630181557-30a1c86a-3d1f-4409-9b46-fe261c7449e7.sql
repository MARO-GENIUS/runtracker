
-- Add target_time_minutes column to training_settings table
ALTER TABLE public.training_settings 
ADD COLUMN target_time_minutes integer;

-- Add a comment to explain the column
COMMENT ON COLUMN public.training_settings.target_time_minutes IS 'Target time for the race goal in minutes (e.g., 120 for 2h00)';
