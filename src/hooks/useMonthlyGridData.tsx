
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DayData {
  date: string;
  distance: number;
  activitiesCount: number;
}

interface MonthlyGridStats {
  totalKm: number;
  averageDaily: number;
  runningDays: number;
  gridData: DayData[];
}

export const useMonthlyGridData = (monthDate: Date) => {
  const [stats, setStats] = useState<MonthlyGridStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const monthBounds = useMemo(() => {
    const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);
    return { startOfMonth, endOfMonth };
  }, [monthDate]);

  useEffect(() => {
    const fetchMonthlyGrid = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { startOfMonth, endOfMonth } = monthBounds;

        const { data: activities, error: fetchError } = await supabase
          .from('strava_activities')
          .select('distance, start_date_local')
          .eq('user_id', user.id)
          .in('type', ['Run', 'VirtualRun'])
          .gte('start_date_local', startOfMonth.toISOString())
          .lte('start_date_local', endOfMonth.toISOString())
          .order('start_date_local', { ascending: true });

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        // Create grid for all days in month
        const daysInMonth = endOfMonth.getDate();
        const gridData: DayData[] = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
          const dateStr = date.toISOString().split('T')[0];
          
          gridData.push({
            date: dateStr,
            distance: 0,
            activitiesCount: 0
          });
        }

        // Fill with activity data
        if (activities) {
          activities.forEach(activity => {
            const activityDate = new Date(activity.start_date_local);
            const dayIndex = activityDate.getDate() - 1;
            
            if (dayIndex >= 0 && dayIndex < gridData.length) {
              gridData[dayIndex].distance += activity.distance / 1000;
              gridData[dayIndex].activitiesCount += 1;
            }
          });
        }

        // Round distances
        gridData.forEach(day => {
          day.distance = Math.round(day.distance * 10) / 10;
        });

        // Calculate stats
        const totalKm = gridData.reduce((sum, day) => sum + day.distance, 0);
        const averageDaily = totalKm / daysInMonth;
        const runningDays = gridData.filter(day => day.distance > 0).length;

        setStats({
          totalKm: Math.round(totalKm * 10) / 10,
          averageDaily: Math.round(averageDaily * 10) / 10,
          runningDays,
          gridData
        });

      } catch (error: any) {
        console.error('Error fetching monthly grid:', error);
        setError(error.message || 'Erreur lors du chargement des données mensuelles');
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyGrid();
  }, [user, monthBounds]);

  return { stats, loading, error };
};
