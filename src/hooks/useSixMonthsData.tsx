
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface WeekData {
  week: string;
  distance: number;
  startDate: string;
  endDate: string;
}

interface SixMonthsStats {
  totalKm: number;
  averageWeekly: number;
  activeWeeks: number;
  weeksData: WeekData[];
}

export const useSixMonthsData = (startDate: Date) => {
  const [stats, setStats] = useState<SixMonthsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const sixMonthsBounds = useMemo(() => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setMonth(end.getMonth() + 6);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  }, [startDate]);

  useEffect(() => {
    const fetchSixMonthsData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { start, end } = sixMonthsBounds;

        const { data: activities, error: fetchError } = await supabase
          .from('strava_activities')
          .select('distance, start_date_local')
          .eq('user_id', user.id)
          .in('type', ['Run', 'VirtualRun'])
          .gte('start_date_local', start.toISOString())
          .lte('start_date_local', end.toISOString())
          .order('start_date_local', { ascending: true });

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        // Generate weeks for 6 months
        const weeksData: WeekData[] = [];
        let currentDate = new Date(start);

        while (currentDate <= end) {
          const weekStart = new Date(currentDate);
          const weekEnd = new Date(currentDate);
          weekEnd.setDate(weekEnd.getDate() + 6);
          
          if (weekEnd > end) {
            weekEnd.setTime(end.getTime());
          }

          const weekNumber = Math.ceil((weekStart.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
          
          weeksData.push({
            week: `S${weekNumber}`,
            distance: 0,
            startDate: weekStart.toISOString().split('T')[0],
            endDate: weekEnd.toISOString().split('T')[0]
          });

          currentDate.setDate(currentDate.getDate() + 7);
        }

        // Fill with activity data
        if (activities) {
          activities.forEach(activity => {
            const activityDate = new Date(activity.start_date_local);
            
            const weekIndex = weeksData.findIndex(week => {
              const weekStartDate = new Date(week.startDate);
              const weekEndDate = new Date(week.endDate);
              return activityDate >= weekStartDate && activityDate <= weekEndDate;
            });

            if (weekIndex !== -1) {
              weeksData[weekIndex].distance += activity.distance / 1000;
            }
          });
        }

        // Round distances
        weeksData.forEach(week => {
          week.distance = Math.round(week.distance * 10) / 10;
        });

        // Calculate stats
        const totalKm = weeksData.reduce((sum, week) => sum + week.distance, 0);
        const averageWeekly = totalKm / weeksData.length;
        const activeWeeks = weeksData.filter(week => week.distance > 0).length;

        setStats({
          totalKm: Math.round(totalKm * 10) / 10,
          averageWeekly: Math.round(averageWeekly * 10) / 10,
          activeWeeks,
          weeksData
        });

      } catch (error: any) {
        console.error('Error fetching 6 months data:', error);
        setError(error.message || 'Erreur lors du chargement des données sur 6 mois');
      } finally {
        setLoading(false);
      }
    };

    fetchSixMonthsData();
  }, [user, sixMonthsBounds]);

  return { stats, loading, error };
};
