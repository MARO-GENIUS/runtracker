
-- Ajouter les colonnes pour les données de parcours GPS dans la table strava_activities
ALTER TABLE public.strava_activities 
ADD COLUMN IF NOT EXISTS map_polyline TEXT,
ADD COLUMN IF NOT EXISTS map_summary_polyline TEXT,
ADD COLUMN IF NOT EXISTS start_latlng TEXT,
ADD COLUMN IF NOT EXISTS end_latlng TEXT;

-- Ajouter un index sur les colonnes de carte pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_strava_activities_map_data 
ON public.strava_activities(user_id) 
WHERE map_polyline IS NOT NULL;
