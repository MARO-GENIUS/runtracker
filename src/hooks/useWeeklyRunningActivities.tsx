
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface WeeklyActivity {
  day: string;
  distance: number;
}

interface WeeklyStats {
  totalKm: number;
  averageDaily: number;
  runningDays: number;
  weeklyData: WeeklyActivity[];
}

interface UseWeeklyRunningActivitiesProps {
  weekDate?: Date;
}

export const useWeeklyRunningActivities = ({ weekDate }: UseWeeklyRunningActivitiesProps = {}) => {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const getWeekBounds = (date: Date = new Date()) => {
    const dayOfWeek = date.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return { startOfWeek, endOfWeek };
  };

  const fetchWeeklyActivities = async () => {
    if (!user) {
      setError('Utilisateur non connecté');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { startOfWeek, endOfWeek } = getWeekBounds(weekDate);

      const { data: activities, error: fetchError } = await supabase
        .from('strava_activities')
        .select('*')
        .eq('user_id', user.id)
        .in('type', ['Run', 'VirtualRun'])
        .gte('start_date_local', startOfWeek.toISOString())
        .lte('start_date_local', endOfWeek.toISOString())
        .order('start_date_local', { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Créer un tableau avec tous les jours de la semaine
      const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      const weeklyData: WeeklyActivity[] = dayNames.map(day => ({ day, distance: 0 }));

      // Remplir les données réelles
      if (activities) {
        activities.forEach(activity => {
          const activityDate = new Date(activity.start_date_local);
          const dayIndex = (activityDate.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
          weeklyData[dayIndex].distance += activity.distance / 1000; // Convert to km
        });
      }

      // Arrondir les distances
      weeklyData.forEach(day => {
        day.distance = Math.round(day.distance * 10) / 10;
      });

      // Calculer les statistiques
      const totalKm = weeklyData.reduce((sum, day) => sum + day.distance, 0);
      const averageDaily = totalKm / 7;
      const runningDays = weeklyData.filter(day => day.distance > 0).length;

      setStats({
        totalKm: Math.round(totalKm * 10) / 10,
        averageDaily: Math.round(averageDaily * 10) / 10,
        runningDays,
        weeklyData
      });

    } catch (error: any) {
      console.error('Error fetching weekly activities:', error);
      setError(error.message || 'Erreur lors du chargement des activités hebdomadaires');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyActivities();
  }, [user, weekDate]);

  return {
    stats,
    loading,
    error,
    refetch: fetchWeeklyActivities
  };
};
