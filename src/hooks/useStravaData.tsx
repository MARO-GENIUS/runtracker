import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStatsCache } from '@/hooks/useStatsCache';
import { useAutoSync } from '@/hooks/useAutoSync';
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
  isAutoSyncing: boolean;
  lastSyncTime: Date | null;
}

export const useStravaData = (): UseStravaDataReturn => {
  const [stats, setStats] = useState<StravaStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStravaConnected, setIsStravaConnected] = useState(false);
  const { user } = useAuth();
  const { getCachedStats, setCachedStats } = useStatsCache();
  
  // Intégration de la synchronisation automatique
  const { isAutoSyncing, lastSyncTime, performAutoSync } = useAutoSync({
    intervalHours: 6,
    syncOnAppStart: true,
    syncOnFocus: true
  });

  const checkStravaConnection = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('strava_access_token')
        .eq('id', user.id)
        .single();

      const connected = !!profile?.strava_access_token;
      setIsStravaConnected(connected);
      
      // Si Strava est connecté, charger les stats automatiquement
      if (connected) {
        await loadCachedStats();
      }
    } catch (error) {
      console.error('Error checking Strava connection:', error);
      setIsStravaConnected(false);
    }
  };

  const loadCachedStats = async () => {
    if (!user) return;

    console.log('Chargement des stats depuis le cache...');
    
    try {
      // Charger les stats depuis le cache
      const cachedStats = await getCachedStats();

      if (cachedStats) {
        console.log('Stats trouvées dans le cache:', cachedStats);
        setStats(cachedStats);
        return;
      }

      console.log('Pas de cache, calcul depuis les activités...');
      // Si pas de cache, calculer depuis les activités
      await loadStats();
    } catch (error) {
      console.error('Error loading cached stats:', error);
      await loadStats();
    }
  };

  const loadStats = async () => {
    if (!user || !isStravaConnected) return;

    setLoading(true);
    console.log('Calcul des stats depuis les activités...');
    
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

      console.log('Activités du mois trouvées:', monthActivities?.length || 0);
      console.log('Activités de l\'année trouvées:', yearActivities?.length || 0);

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

      console.log('Stats calculées:', calculatedStats);
      setStats(calculatedStats);
      await setCachedStats(calculatedStats);
    } catch (error) {
      console.error('Error loading stats:', error);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  // Fonction de synchronisation manuelle (conservée pour compatibilité)
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
        await setCachedStats(data.stats);
        
        if (data.message) {
          toast.success(data.message);
        } else {
          toast.success(`${data.activities_synced || 0} activités synchronisées`);
        }
        
        if (data.best_efforts_status && !data.best_efforts_status.success) {
          toast.info('Synchronisation partielle - certains détails seront récupérés lors de la prochaine synchronisation');
        }
      } else {
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

  // Effet principal pour initialiser les données
  useEffect(() => {
    if (user) {
      console.log('Utilisateur connecté, vérification de Strava...');
      checkStravaConnection();
    } else {
      setStats(null);
      setIsStravaConnected(false);
    }
  }, [user]);

  // Écouter les changements de synchronisation automatique
  useEffect(() => {
    if (isAutoSyncing) {
      console.log('Synchronisation automatique en cours...');
    }
  }, [isAutoSyncing]);

  // Rafraîchir les stats après une synchronisation automatique
  useEffect(() => {
    if (!isAutoSyncing && lastSyncTime && isStravaConnected) {
      console.log('Synchronisation terminée, rechargement des stats...');
      loadCachedStats();
    }
  }, [isAutoSyncing, lastSyncTime, isStravaConnected]);

  return {
    stats,
    loading: loading,
    error,
    syncActivities,
    isStravaConnected,
    loadStats,
    isAutoSyncing,
    lastSyncTime
  };
};
