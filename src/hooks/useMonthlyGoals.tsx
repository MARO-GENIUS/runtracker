
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MonthlyGoal {
  id: string;
  year: number;
  month: number;
  goal_km: number;
}

interface UseMonthlyGoalsReturn {
  currentGoal: number;
  loading: boolean;
  error: string | null;
  updateGoal: (goalKm: number) => Promise<void>;
}

export const useMonthlyGoals = (): UseMonthlyGoalsReturn => {
  const [currentGoal, setCurrentGoal] = useState<number>(200); // Valeur par défaut
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() retourne 0-11

  const fetchCurrentGoal = async () => {
    if (!user) {
      setError('Utilisateur non connecté');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: goalData, error: fetchError } = await supabase
        .from('monthly_goals')
        .select('goal_km')
        .eq('user_id', user.id)
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .maybeSingle();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Si un objectif existe pour ce mois, l'utiliser, sinon garder la valeur par défaut (200)
      if (goalData) {
        setCurrentGoal(goalData.goal_km);
      } else {
        // Créer un objectif par défaut pour ce mois
        await createDefaultGoal();
      }

    } catch (error: any) {
      console.error('Error fetching monthly goal:', error);
      setError(error.message || 'Erreur lors du chargement de l\'objectif');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultGoal = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('monthly_goals')
        .insert({
          user_id: user.id,
          year: currentYear,
          month: currentMonth,
          goal_km: 200
        });

      if (error) {
        console.error('Error creating default goal:', error);
      }
    } catch (error) {
      console.error('Error creating default goal:', error);
    }
  };

  const updateGoal = async (goalKm: number) => {
    if (!user) {
      setError('Utilisateur non connecté');
      return;
    }

    try {
      setError(null);

      const { error } = await supabase
        .from('monthly_goals')
        .upsert({
          user_id: user.id,
          year: currentYear,
          month: currentMonth,
          goal_km: goalKm
        }, {
          onConflict: 'user_id,year,month'
        });

      if (error) {
        throw new Error(error.message);
      }

      setCurrentGoal(goalKm);
    } catch (error: any) {
      console.error('Error updating goal:', error);
      setError(error.message || 'Erreur lors de la mise à jour de l\'objectif');
    }
  };

  useEffect(() => {
    fetchCurrentGoal();
  }, [user]);

  return {
    currentGoal,
    loading,
    error,
    updateGoal
  };
};
