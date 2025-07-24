
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MonthData {
  month: string;
  distance: number;
  activitiesCount: number;
  monthNumber: number;
}

interface YearlyStats {
  totalKm: number;
  averageMonthly: number;
  activeMonths: number;
  monthsData: MonthData[];
}

export const useYearlyData = (year: number) => {
  const [stats, setStats] = useState<YearlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const yearBounds = useMemo(() => {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
    return { startOfYear, endOfYear };
  }, [year]);

  useEffect(() => {
    const fetchYearlyData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { startOfYear, endOfYear } = yearBounds;

        const { data: activities, error: fetchError } = await supabase
          .from('strava_activities')
          .select('distance, start_date_local')
          .eq('user_id', user.id)
          .in('type', ['Run', 'VirtualRun'])
          .gte('start_date_local', startOfYear.toISOString())
          .lte('start_date_local', endOfYear.toISOString())
          .order('start_date_local', { ascending: true });

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        // Generate months for the year
        const monthNames = [
          'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
          'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];

        const monthsData: MonthData[] = monthNames.map((month, index) => ({
          month,
          distance: 0,
          activitiesCount: 0,
          monthNumber: index + 1
        }));

        // Fill with activity data
        if (activities) {
          activities.forEach(activity => {
            const activityDate = new Date(activity.start_date_local);
            const monthIndex = activityDate.getMonth();
            
            if (monthIndex >= 0 && monthIndex < monthsData.length) {
              monthsData[monthIndex].distance += activity.distance / 1000;
              monthsData[monthIndex].activitiesCount += 1;
            }
          });
        }

        // Round distances
        monthsData.forEach(month => {
          month.distance = Math.round(month.distance * 10) / 10;
        });

        // Calculate stats
        const totalKm = monthsData.reduce((sum, month) => sum + month.distance, 0);
        const averageMonthly = totalKm / 12;
        const activeMonths = monthsData.filter(month => month.distance > 0).length;

        setStats({
          totalKm: Math.round(totalKm * 10) / 10,
          averageMonthly: Math.round(averageMonthly * 10) / 10,
          activeMonths,
          monthsData
        });

      } catch (error: any) {
        console.error('Error fetching yearly data:', error);
        setError(error.message || 'Erreur lors du chargement des données annuelles');
      } finally {
        setLoading(false);
      }
    };

    fetchYearlyData();
  }, [user, yearBounds]);

  return { stats, loading, error };
};
