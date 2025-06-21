
-- Créer la table pour mettre en cache les statistiques utilisateur
CREATE TABLE public.user_stats_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  stats_data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Activer RLS pour sécuriser l'accès aux données
ALTER TABLE public.user_stats_cache ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs ne voient que leurs propres données
CREATE POLICY "Users can view their own cached stats" 
  ON public.user_stats_cache 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Politique pour que les utilisateurs puissent créer leurs propres données de cache
CREATE POLICY "Users can create their own cached stats" 
  ON public.user_stats_cache 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Politique pour que les utilisateurs puissent mettre à jour leurs propres données de cache
CREATE POLICY "Users can update their own cached stats" 
  ON public.user_stats_cache 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Politique pour que les utilisateurs puissent supprimer leurs propres données de cache
CREATE POLICY "Users can delete their own cached stats" 
  ON public.user_stats_cache 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Index pour améliorer les performances de recherche
CREATE INDEX idx_user_stats_cache_user_id ON public.user_stats_cache(user_id);
CREATE INDEX idx_user_stats_cache_updated_at ON public.user_stats_cache(updated_at);
