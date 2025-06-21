
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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

interface UseStravaDataReturn {
  stats: StravaStats | null;
  loading: boolean;
  error: string | null;
  syncActivities: () => Promise<void>;
  isStravaConnected: boolean;
  loadStats: () => Promise<void>;
}

export const useStravaData = (): UseStravaDataReturn => {
  const [stats, setStats] = useState<StravaStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStravaConnected, setIsStravaConnected] = useState(false);
  const { user } = useAuth();

  const checkStravaConnection = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('strava_access_token')
        .eq('id', user.id)
        .single();

      setIsStravaConnected(!!profile?.strava_access_token);
      
      // Si Strava est connecté, charger les stats depuis le cache ou calculer
      if (profile?.strava_access_token) {
        await loadCachedStats();
      }
    } catch (error) {
      console.error('Error checking Strava connection:', error);
      setIsStravaConnected(false);
    }
  };

  const loadCachedStats = async () => {
    if (!user) return;

    try {
      // D'abord, essayer de charger les stats depuis le cache
      const { data: cachedStats } = await supabase
        .from('user_stats_cache')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (cachedStats && isRecentCache(cachedStats.updated_at)) {
        // Utiliser les données du cache si elles sont récentes (moins de 1 heure)
        setStats(cachedStats.stats_data);
        console.log('Using cached Strava stats');
        return;
      }

      // Si pas de cache ou cache expiré, calculer depuis les activités
      await loadStats();
    } catch (error) {
      console.error('Error loading cached stats:', error);
      // Fallback : calculer depuis les activités
      await loadStats();
    }
  };

  const isRecentCache = (updatedAt: string): boolean => {
    const cacheTime = new Date(updatedAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 1; // Cache valide pendant 1 heure
  };

  const loadStats = async () => {
    if (!user || !isStravaConnected) return;

    setLoading(true);
    try {
      // Calculer les statistiques à partir des activités existantes
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      // Get current month activities
      const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString();
      const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString();

      const { data: monthActivities } = await supabase
        .from('strava_activities')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_date', startOfMonth)
        .lte('start_date', endOfMonth)
        .order('start_date', { ascending: false });

      // Get current year activities
      const startOfYear = new Date(currentYear, 0, 1).toISOString();
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59).toISOString();

      const { data: yearActivities } = await supabase
        .from('strava_activities')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_date', startOfYear)
        .lte('start_date', endOfYear)
        .order('start_date', { ascending: false });

      // Get latest activity
      const { data: latestActivity } = await supabase
        .from('strava_activities')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })
        .limit(1);

      // Calculate monthly stats
      const monthlyDistance = monthActivities?.reduce((sum, activity) => sum + (activity.distance / 1000), 0) || 0;
      const monthlyActivitiesCount = monthActivities?.length || 0;
      const monthlyDuration = monthActivities?.reduce((sum, activity) => sum + (activity.moving_time || 0), 0) || 0;
      const longestMonthlyActivity = monthActivities?.reduce((longest, activity) => 
        activity.distance > (longest?.distance || 0) ? activity : longest, null);

      // Calculate yearly stats
      const yearlyDistance = yearActivities?.reduce((sum, activity) => sum + (activity.distance / 1000), 0) || 0;
      const yearlyActivitiesCount = yearActivities?.length || 0;

      const calculatedStats: StravaStats = {
        monthly: {
          distance: Math.round(monthlyDistance * 10) / 10,
          activitiesCount: monthlyActivitiesCount,
          duration: monthlyDuration,
          longestActivity: longestMonthlyActivity ? {
            name: longestMonthlyActivity.name,
            distance: Math.round((longestMonthlyActivity.distance / 1000) * 10) / 10,
            date: longestMonthlyActivity.start_date_local
          } : null
        },
        yearly: {
          distance: Math.round(yearlyDistance * 10) / 10,
          activitiesCount: yearlyActivitiesCount
        },
        latest: latestActivity?.[0] ? {
          name: latestActivity[0].name,
          distance: Math.round((latestActivity[0].distance / 1000) * 10) / 10,
          date: latestActivity[0].start_date_local
        } : null
      };

      setStats(calculatedStats);

      // Sauvegarder dans le cache
      await saveCachedStats(calculatedStats);
    } catch (error) {
      console.error('Error loading stats:', error);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const saveCachedStats = async (statsData: StravaStats) => {
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

  const syncActivities = async () => {
    if (!user || !isStravaConnected) {
      setError('Utilisateur non connecté ou Strava non lié');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('sync-strava-activities');

      if (functionError) {
        console.error('Function error:', functionError);
        
        if (functionError.message?.includes('non-2xx status code')) {
          throw new Error('Erreur de synchronisation Strava. Veuillez réessayer dans quelques minutes.');
        }
        
        throw new Error(functionError.message || 'Erreur lors de la synchronisation');
      }

      if (data?.error) {
        if (data.type === 'rate_limit' || data.error.includes('rate limit')) {
          toast.error('Limite de taux Strava atteinte. Veuillez attendre quelques minutes avant de réessayer.');
          setError('Limite de taux Strava atteinte');
          return;
        }
        
        throw new Error(data.error);
      }

      if (data?.stats) {
        setStats(data.stats);
        
        // Sauvegarder immédiatement dans le cache après synchronisation
        await saveCachedStats(data.stats);
        
        if (data.message) {
          toast.success(data.message);
        } else {
          toast.success(`${data.activities_synced || 0} activités synchronisées`);
        }
        
        if (data.best_efforts_status && !data.best_efforts_status.success) {
          toast.info('Synchronisation partielle - certains détails seront récupérés lors de la prochaine synchronisation');
        }
      } else {
        // Fallback: reload stats from database and cache them
        await loadStats();
        toast.success('Données synchronisées avec succès');
      }
    } catch (error: any) {
      console.error('Error syncing activities:', error);
      let errorMessage = 'Erreur lors de la synchronisation des activités';
      
      if (error.message?.includes('rate limit') || error.message?.includes('429')) {
        errorMessage = 'Limite de taux Strava atteinte. Veuillez attendre quelques minutes.';
      } else if (error.message?.includes('token')) {
        errorMessage = 'Problème d\'authentification Strava. Veuillez reconnecter votre compte.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkStravaConnection();
    }
  }, [user]);

  return {
    stats,
    loading,
    error,
    syncActivities,
    isStravaConnected,
    loadStats
  };
};
