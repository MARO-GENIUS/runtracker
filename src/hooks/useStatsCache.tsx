
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

export const useStatsCache = () => {
  const { user } = useAuth();

  const getCachedStats = async (): Promise<StravaStats | null> => {
    if (!user) return null;

    try {
      const { data: cachedStats } = await supabase
        .from('user_stats_cache')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (cachedStats && cachedStats.stats_data) {
        console.log('Stats trouvées dans le cache:', cachedStats);
        return cachedStats.stats_data as unknown as StravaStats;
      }

      return null;
    } catch (error) {
      console.error('Error loading cached stats:', error);
      return null;
    }
  };

  const setCachedStats = async (statsData: StravaStats): Promise<void> => {
    if (!user) return;

    try {
      await supabase
        .from('user_stats_cache')
        .upsert({
          user_id: user.id,
          stats_data: statsData as any,
          updated_at: new Date().toISOString()
        });
      
      console.log('Stats mises en cache avec succès');
    } catch (error) {
      console.error('Error caching stats:', error);
    }
  };

  const updateCachedStats = async (newStats: StravaStats): Promise<void> => {
    if (!user) return;

    try {
      // Remplace directement par les nouvelles stats (plus de mise à jour incrémentale)
      await setCachedStats(newStats);
      console.log('Stats mises à jour dans le cache:', newStats);
    } catch (error) {
      console.error('Error updating cached stats:', error);
    }
  };

  const clearCache = async (): Promise<void> => {
    if (!user) return;

    try {
      await supabase
        .from('user_stats_cache')
        .delete()
        .eq('user_id', user.id);
      
      console.log('Cache vidé avec succès');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  return {
    getCachedStats,
    setCachedStats,
    updateCachedStats,
    clearCache
  };
};
