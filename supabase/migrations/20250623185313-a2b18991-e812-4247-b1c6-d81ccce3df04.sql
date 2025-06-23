
-- Ajouter les colonnes pour la notation d'effort dans la table strava_activities
ALTER TABLE public.strava_activities 
ADD COLUMN effort_rating INTEGER CHECK (effort_rating >= 1 AND effort_rating <= 10),
ADD COLUMN effort_notes TEXT;

-- Créer un index pour optimiser les requêtes sur effort_rating
CREATE INDEX idx_strava_activities_effort_rating ON public.strava_activities(effort_rating);
