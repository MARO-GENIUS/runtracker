
-- Créer une table pour les segments auto-calculés (best_efforts) de Strava
CREATE TABLE public.strava_best_efforts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  activity_id BIGINT NOT NULL REFERENCES public.strava_activities(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- ex: "400m", "1 km", "1 mile", "5 km"
  distance REAL NOT NULL, -- distance en mètres
  moving_time INTEGER NOT NULL, -- temps en secondes
  start_date_local TIMESTAMP WITH TIME ZONE NOT NULL,
  elapsed_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(activity_id, name)
);

-- Activer RLS sur la nouvelle table
ALTER TABLE public.strava_best_efforts ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour strava_best_efforts
CREATE POLICY "Users can view their own best efforts" 
  ON public.strava_best_efforts 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own best efforts" 
  ON public.strava_best_efforts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own best efforts" 
  ON public.strava_best_efforts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own best efforts" 
  ON public.strava_best_efforts 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Créer des index pour optimiser les performances
CREATE INDEX idx_strava_best_efforts_user_id ON public.strava_best_efforts(user_id);
CREATE INDEX idx_strava_best_efforts_activity_id ON public.strava_best_efforts(activity_id);
CREATE INDEX idx_strava_best_efforts_distance ON public.strava_best_efforts(distance);
CREATE INDEX idx_strava_best_efforts_moving_time ON public.strava_best_efforts(moving_time);
