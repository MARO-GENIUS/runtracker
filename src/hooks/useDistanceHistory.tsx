
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DistanceHistoryItem {
  id: string;
  distance: number;
  moving_time: number;
  start_date_local: string;
  activity_id: number;
  activity_name?: string;
  improvement?: number; // en secondes, positif = amélioration
}

export const useDistanceHistory = (targetDistance: number) => {
  const [history, setHistory] = useState<DistanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchDistanceHistory = async () => {
    if (!user || !targetDistance) return;

    try {
      setLoading(true);
      setError(null);

      // Récupérer tous les best efforts pour cette distance
      const { data: bestEfforts, error: fetchError } = await supabase
        .from('strava_best_efforts')
        .select(`
          id,
          distance,
          moving_time,
          start_date_local,
          activity_id,
          strava_activities(name)
        `)
        .eq('user_id', user.id)
        .eq('distance', targetDistance)
        .order('start_date_local', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (bestEfforts) {
        // Calculer les améliorations entre les performances
        const sortedHistory = bestEfforts
          .map((effort: any) => ({
            id: effort.id,
            distance: effort.distance,
            moving_time: effort.moving_time,
            start_date_local: effort.start_date_local,
            activity_id: effort.activity_id,
            activity_name: effort.strava_activities?.name
          }))
          .sort((a, b) => new Date(a.start_date_local).getTime() - new Date(b.start_date_local).getTime());

        // Calculer les améliorations
        const historyWithImprovements = sortedHistory.map((item, index) => {
          if (index === 0) return { ...item, improvement: 0 };
          
          const previousBest = sortedHistory
            .slice(0, index)
            .reduce((best, current) => 
              current.moving_time < best.moving_time ? current : best
            );
          
          const improvement = previousBest.moving_time - item.moving_time;
          return { ...item, improvement };
        });

        setHistory(historyWithImprovements.reverse()); // Plus récent en premier
      }

    } catch (error: any) {
      console.error('Error fetching distance history:', error);
      setError(error.message || 'Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetDistance > 0) {
      fetchDistanceHistory();
    }
  }, [user, targetDistance]);

  return {
    history,
    loading,
    error,
    refetch: fetchDistanceHistory
  };
};
