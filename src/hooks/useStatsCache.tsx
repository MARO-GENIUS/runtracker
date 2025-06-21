
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

      if (cachedStats && isRecentCache(cachedStats.updated_at)) {
        return cachedStats.stats_data;
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
          stats_data: statsData,
          updated_at: new Date().toISOString()
        });
      
      console.log('Stats cached successfully');
    } catch (error) {
      console.error('Error caching stats:', error);
    }
  };

  const isRecentCache = (updatedAt: string): boolean => {
    const cacheTime = new Date(updatedAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 1; // Cache valide pendant 1 heure
  };

  const clearCache = async (): Promise<void> => {
    if (!user) return;

    try {
      await supabase
        .from('user_stats_cache')
        .delete()
        .eq('user_id', user.id);
      
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  return {
    getCachedStats,
    setCachedStats,
    clearCache,
    isRecentCache
  };
};
