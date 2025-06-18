
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DailyActivity {
  date: string; // YYYY-MM-DD format
  activities: {
    id: number;
    name: string;
    distance: number; // in meters
    moving_time: number; // in seconds
    average_speed: number | null;
    start_date_local: string;
  }[];
  totalDistance: number; // in km
}

interface UseMonthlyRunningActivitiesReturn {
  dailyActivities: Record<string, DailyActivity>;
  loading: boolean;
  error: string | null;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
}

export const useMonthlyRunningActivities = (): UseMonthlyRunningActivitiesReturn => {
  const [dailyActivities, setDailyActivities] = useState<Record<string, DailyActivity>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { user } = useAuth();

  const fetchMonthlyActivities = async (month: Date) => {
    if (!user) {
      setError('Utilisateur non connecté');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Calculate month bounds
      const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999);

      const { data: activities, error: fetchError } = await supabase
        .from('strava_activities')
        .select('id, name, distance, moving_time, average_speed, start_date_local')
        .eq('user_id', user.id)
        .in('type', ['Run', 'VirtualRun'])
        .gte('start_date_local', startOfMonth.toISOString())
        .lte('start_date_local', endOfMonth.toISOString())
        .order('start_date_local', { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Group activities by date
      const grouped: Record<string, DailyActivity> = {};
      
      if (activities) {
        activities.forEach(activity => {
          // Use the local date from start_date_local to avoid timezone issues
          const localDate = new Date(activity.start_date_local);
          // Format the date manually to avoid timezone conversion
          const year = localDate.getFullYear();
          const month = String(localDate.getMonth() + 1).padStart(2, '0');
          const day = String(localDate.getDate()).padStart(2, '0');
          const date = `${year}-${month}-${day}`;
          
          if (!grouped[date]) {
            grouped[date] = {
              date,
              activities: [],
              totalDistance: 0
            };
          }
          
          grouped[date].activities.push(activity);
          grouped[date].totalDistance += activity.distance / 1000; // Convert to km
        });
      }

      setDailyActivities(grouped);
    } catch (error: any) {
      console.error('Error fetching monthly activities:', error);
      setError(error.message || 'Erreur lors du chargement des activités');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyActivities(currentMonth);
  }, [user, currentMonth]);

  return {
    dailyActivities,
    loading,
    error,
    currentMonth,
    setCurrentMonth
  };
};
