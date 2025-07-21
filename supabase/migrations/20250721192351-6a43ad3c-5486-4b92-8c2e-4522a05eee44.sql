
-- Create workout_details table to store detailed workout information
CREATE TABLE public.workout_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id BIGINT NOT NULL,
  user_id UUID NOT NULL,
  session_type TEXT NOT NULL,
  workout_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.workout_details ENABLE ROW LEVEL SECURITY;

-- Create policies for workout_details
CREATE POLICY "Users can view their own workout details" 
  ON public.workout_details 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout details" 
  ON public.workout_details 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout details" 
  ON public.workout_details 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout details" 
  ON public.workout_details 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_workout_details_activity_id ON public.workout_details(activity_id);
CREATE INDEX idx_workout_details_user_id ON public.workout_details(user_id);
