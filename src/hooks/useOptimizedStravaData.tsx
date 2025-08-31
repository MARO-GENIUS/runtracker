import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface StravaStats {
  monthly: {
    distance: number;
    activitiesCount: number;
    duration: number;
    longestActivity: {
      name: string;
      distance: number;
      date: string;
    } | null;
  };
  yearly: {
    distance: number;
    activitiesCount: number;
  };
  latest: {
    name: string;
    distance: number;
    date: string;
  } | null;
}

interface UseOptimizedStravaDataReturn {
  stats: StravaStats | null;
  loading: boolean;
  error: string | null;
  syncActivities: () => Promise<void>;
  isStravaConnected: boolean;
  loadStats: () => Promise<void>;
  isAutoSyncing: boolean;
  lastSyncTime: Date | null;
  rateLimitInfo: {
    dailyUsage: number;
    fifteenMinuteUsage: number;
    dailyLimit: number;
    fifteenMinuteLimit: number;
  } | null;
}

export const useOptimizedStravaData = (): UseOptimizedStravaDataReturn => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StravaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStravaConnected, setIsStravaConnected] = useState(false);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    dailyUsage: number;
    fifteenMinuteUsage: number;
    dailyLimit: number;
    fifteenMinuteLimit: number;
  } | null>(null);

  const checkStravaConnection = useCallback(async () => {
    if (!user) return false;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('strava_user_id')
        .eq('id', user.id)
        .single();

      const connected = !!profile?.strava_user_id;
      setIsStravaConnected(connected);
      return connected;
    } catch (error) {
      console.error('Error checking Strava connection:', error);
      return false;
    }
  }, [user]);

  const loadStatsFromDatabase = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      // Get monthly and yearly stats from the pre-calculated table
      const { data: monthlyStats } = await supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', user.id)
        .eq('period_type', 'monthly')
        .eq('period_year', currentYear)
        .eq('period_month', currentMonth)
        .maybeSingle();

      const { data: yearlyStats } = await supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', user.id)
        .eq('period_type', 'yearly')
        .eq('period_year', currentYear)
        .maybeSingle();

      // Format the stats to match the existing interface
      const formattedStats: StravaStats = {
        monthly: {
          distance: monthlyStats?.total_distance || 0,
          activitiesCount: monthlyStats?.total_activities || 0,
          duration: monthlyStats?.total_time || 0,
          longestActivity: monthlyStats?.longest_activity_name ? {
            name: monthlyStats.longest_activity_name,
            distance: monthlyStats.longest_activity_distance || 0,
            date: monthlyStats.longest_activity_date || new Date().toISOString()
          } : null
        },
        yearly: {
          distance: yearlyStats?.total_distance || 0,
          activitiesCount: yearlyStats?.total_activities || 0
        },
        latest: monthlyStats?.latest_activity_name ? {
          name: monthlyStats.latest_activity_name,
          distance: monthlyStats.latest_activity_distance || 0,
          date: monthlyStats.latest_activity_date || new Date().toISOString()
        } : null
      };

      setStats(formattedStats);
    } catch (error) {
      console.error('Error loading stats from database:', error);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const syncActivities = useCallback(async () => {
    if (!user) return;

    try {
      setIsAutoSyncing(true);
      setError(null);

      const { data, error: syncError } = await supabase.functions.invoke('sync-strava-activities', {
        body: { userId: user.id }
      });

      if (syncError) {
        throw syncError;
      }

      if (data?.rateLimitInfo) {
        setRateLimitInfo(data.rateLimitInfo);
      }

      setLastSyncTime(new Date());
      
      // Reload stats after sync (they should be automatically updated by triggers)
      await loadStatsFromDatabase();
      
    } catch (error: any) {
      console.error('Error syncing activities:', error);
      if (error.message?.includes('Rate limit')) {
        setError('Limite de taux atteinte. Veuillez réessayer plus tard.');
      } else {
        setError('Erreur lors de la synchronisation des activités');
      }
    } finally {
      setIsAutoSyncing(false);
    }
  }, [user, loadStatsFromDatabase]);

  const loadStats = useCallback(async () => {
    await loadStatsFromDatabase();
  }, [loadStatsFromDatabase]);

  // Initialize data when user changes
  useEffect(() => {
    if (user) {
      checkStravaConnection().then(async (connected) => {
        if (connected) {
          await loadStatsFromDatabase();
        } else {
          setLoading(false);
        }
      });
    } else {
      setStats(null);
      setLoading(false);
      setIsStravaConnected(false);
    }
  }, [user, checkStravaConnection, loadStatsFromDatabase]);

  // Listen for real-time updates to user_statistics
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-statistics-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_statistics',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Statistics updated:', payload);
          // Reload stats when they change
          loadStatsFromDatabase();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadStatsFromDatabase]);

  // Listen for custom events (like manual sync triggers)
  useEffect(() => {
    const handleRefresh = () => {
      loadStatsFromDatabase();
    };

    const handleSyncUpdate = (event: any) => {
      if (event.detail.isAutoSyncing !== undefined) {
        setIsAutoSyncing(event.detail.isAutoSyncing);
      }
    };

    window.addEventListener('strava-stats-refresh', handleRefresh);
    window.addEventListener('strava-sync-update', handleSyncUpdate);

    return () => {
      window.removeEventListener('strava-stats-refresh', handleRefresh);
      window.removeEventListener('strava-sync-update', handleSyncUpdate);
    };
  }, [loadStatsFromDatabase]);

  return {
    stats,
    loading,
    error,
    syncActivities,
    isStravaConnected,
    loadStats,
    isAutoSyncing,
    lastSyncTime,
    rateLimitInfo
  };
};