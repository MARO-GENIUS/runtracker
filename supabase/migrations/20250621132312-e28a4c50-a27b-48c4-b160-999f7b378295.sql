
-- Créer une table pour stocker les objectifs mensuels des utilisateurs
CREATE TABLE public.monthly_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  goal_km INTEGER NOT NULL DEFAULT 200,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, year, month)
);

-- Activer RLS pour que chaque utilisateur ne voit que ses objectifs
ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;

-- Politique pour voir ses propres objectifs
CREATE POLICY "Users can view their own monthly goals" 
  ON public.monthly_goals 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Politique pour créer ses propres objectifs
CREATE POLICY "Users can create their own monthly goals" 
  ON public.monthly_goals 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Politique pour modifier ses propres objectifs
CREATE POLICY "Users can update their own monthly goals" 
  ON public.monthly_goals 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Politique pour supprimer ses propres objectifs
CREATE POLICY "Users can delete their own monthly goals" 
  ON public.monthly_goals 
  FOR DELETE 
  USING (auth.uid() = user_id);
