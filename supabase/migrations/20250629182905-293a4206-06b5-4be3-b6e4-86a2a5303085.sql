
-- Create a table to store training settings for each user
CREATE TABLE public.training_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  target_race text NOT NULL DEFAULT '10k',
  target_date timestamp with time zone,
  weekly_frequency integer NOT NULL DEFAULT 3,
  preferred_days text[] NOT NULL DEFAULT '{}',
  available_time_slots text[] NOT NULL DEFAULT '{}',
  max_intensity text NOT NULL DEFAULT 'medium',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Add Row Level Security (RLS) to ensure users can only access their own settings
ALTER TABLE public.training_settings ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to SELECT their own training settings
CREATE POLICY "Users can view their own training settings" 
  ON public.training_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to INSERT their own training settings
CREATE POLICY "Users can create their own training settings" 
  ON public.training_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to UPDATE their own training settings
CREATE POLICY "Users can update their own training settings" 
  ON public.training_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to DELETE their own training settings
CREATE POLICY "Users can delete their own training settings" 
  ON public.training_settings 
  FOR DELETE 
  USING (auth.uid() = user_id);
