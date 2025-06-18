
-- Créer une table pour les profils utilisateurs
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  strava_user_id INTEGER UNIQUE,
  strava_access_token TEXT,
  strava_refresh_token TEXT,
  strava_expires_at BIGINT,
  first_name TEXT,
  last_name TEXT,
  profile_picture TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Créer une table pour les activités Strava
CREATE TABLE public.strava_activities (
  id BIGINT PRIMARY KEY, -- ID de l'activité Strava
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  distance REAL NOT NULL, -- en mètres
  moving_time INTEGER NOT NULL, -- en secondes
  elapsed_time INTEGER NOT NULL, -- en secondes
  total_elevation_gain REAL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  start_date_local TIMESTAMP WITH TIME ZONE NOT NULL,
  location_city TEXT,
  location_state TEXT,
  location_country TEXT,
  average_speed REAL, -- en m/s
  max_speed REAL, -- en m/s
  average_heartrate REAL,
  max_heartrate REAL,
  suffer_score REAL,
  calories REAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer une table pour les records personnels
CREATE TABLE public.personal_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  distance_type TEXT NOT NULL, -- '400m', '1km', '5km', '10km', 'semi', 'marathon'
  distance_meters INTEGER NOT NULL,
  time_seconds INTEGER NOT NULL,
  activity_id BIGINT REFERENCES public.strava_activities(id),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, distance_type)
);

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strava_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Politiques RLS pour strava_activities
CREATE POLICY "Users can view their own activities" 
  ON public.strava_activities 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" 
  ON public.strava_activities 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities" 
  ON public.strava_activities 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" 
  ON public.strava_activities 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Politiques RLS pour personal_records
CREATE POLICY "Users can view their own records" 
  ON public.personal_records 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own records" 
  ON public.personal_records 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own records" 
  ON public.personal_records 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own records" 
  ON public.personal_records 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Créer un trigger pour automatiquement créer un profil lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );
  RETURN new;
END;
$$;

-- Déclencher la fonction à chaque nouvel utilisateur
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Créer des index pour optimiser les performances
CREATE INDEX idx_strava_activities_user_id ON public.strava_activities(user_id);
CREATE INDEX idx_strava_activities_start_date ON public.strava_activities(start_date);
CREATE INDEX idx_strava_activities_type ON public.strava_activities(type);
CREATE INDEX idx_personal_records_user_id ON public.personal_records(user_id);
CREATE INDEX idx_profiles_strava_user_id ON public.profiles(strava_user_id);
