
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
        // Trier par date chronologique
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

        // Ne garder que les vrais records progressifs
        const progressiveRecords = sortedHistory.reduce((records: any[], current) => {
          if (records.length === 0) {
            // Premier record
            return [{ ...current, improvement: 0 }];
          }
          
          const currentBest = records[records.length - 1];
          if (current.moving_time < currentBest.moving_time) {
            // Nouveau record ! Calculer l'amélioration
            const improvement = currentBest.moving_time - current.moving_time;
            records.push({ ...current, improvement });
          }
          // Sinon on ignore cette performance (pas un record)
          
          return records;
        }, []);

        // Filtrer sur les 3 dernières années
        const cutoffDate = new Date();
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 3);
        const filteredRecords = progressiveRecords.filter((item) =>
          new Date(item.start_date_local).getTime() >= cutoffDate.getTime()
        );

        setHistory(filteredRecords.reverse()); // Plus récent en premier
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
