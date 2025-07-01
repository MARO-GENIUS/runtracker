
-- Add a field to track if the association was made manually
ALTER TABLE public.ai_recommendations 
ADD COLUMN is_manual_match BOOLEAN DEFAULT FALSE;

-- Add an index for better performance when querying manual matches
CREATE INDEX idx_ai_recommendations_manual_match ON public.ai_recommendations(is_manual_match);
