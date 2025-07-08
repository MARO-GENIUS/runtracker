
-- Ajouter la colonne last_session_type à la table training_settings
ALTER TABLE public.training_settings 
ADD COLUMN last_session_type text;
