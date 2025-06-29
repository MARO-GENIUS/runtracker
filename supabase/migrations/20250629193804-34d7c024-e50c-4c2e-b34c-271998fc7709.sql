
-- Créer la table pour stocker les recommandations IA persistantes
CREATE TABLE public.ai_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_data JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  matching_activity_id BIGINT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur la table
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs voient uniquement leurs recommandations
CREATE POLICY "Users can view their own AI recommendations" 
  ON public.ai_recommendations 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Politique pour que les utilisateurs créent leurs propres recommandations
CREATE POLICY "Users can create their own AI recommendations" 
  ON public.ai_recommendations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Politique pour que les utilisateurs mettent à jour leurs recommandations
CREATE POLICY "Users can update their own AI recommendations" 
  ON public.ai_recommendations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Politique pour que les utilisateurs suppriment leurs recommandations
CREATE POLICY "Users can delete their own AI recommendations" 
  ON public.ai_recommendations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Index pour optimiser les requêtes
CREATE INDEX idx_ai_recommendations_user_status ON public.ai_recommendations(user_id, status);
CREATE INDEX idx_ai_recommendations_generated_at ON public.ai_recommendations(generated_at DESC);
