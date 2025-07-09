
-- Ajouter la colonne session_type à la table strava_activities
ALTER TABLE public.strava_activities 
ADD COLUMN session_type text;
