
-- Activer Realtime sur la table des activités Strava
-- 1) S'assurer que les lignes complètes sont répliquées pour les mises à jour/suppressions
ALTER TABLE public.strava_activities REPLICA IDENTITY FULL;

-- 2) Ajouter la table à la publication supabase_realtime
-- (Si la table est déjà ajoutée, cette commande sera ignorée sans effet néfaste)
ALTER PUBLICATION supabase_realtime ADD TABLE public.strava_activities;
