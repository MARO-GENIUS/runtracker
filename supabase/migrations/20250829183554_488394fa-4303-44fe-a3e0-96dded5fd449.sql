-- Create secure table for encrypted tokens
CREATE TABLE public.encrypted_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_access_token TEXT,
  encrypted_refresh_token TEXT,
  token_expires_at BIGINT,
  encryption_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.encrypted_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - these tokens should NEVER be accessible via the client API
CREATE POLICY "No client access to encrypted tokens"
ON public.encrypted_tokens
FOR ALL
USING (false);

-- Create function to handle token updates
CREATE OR REPLACE FUNCTION public.update_encrypted_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_encrypted_tokens_updated_at
BEFORE UPDATE ON public.encrypted_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_encrypted_tokens_updated_at();

-- Remove sensitive token columns from profiles table (we'll keep strava_user_id and expires_at for convenience)
-- Note: We're keeping strava_expires_at in profiles for easy access checks
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS strava_access_token,
DROP COLUMN IF EXISTS strava_refresh_token;