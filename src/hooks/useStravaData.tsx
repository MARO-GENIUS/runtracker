import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStatsCache } from '@/hooks/useStatsCache';
import { useStravaRateLimit } from '@/hooks/useStravaRateLimit';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
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
  rateLimitInfo: {
    requestsUsed: number;
    canMakeRequest: boolean;
    remainingRequests: number;
    usagePercentage: number;
  };
}

export const useStravaData = (): UseStravaDataReturn => {
  const [stats, setStats] = useState<StravaStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStravaConnected, setIsStravaConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { user } = useAuth();
  const { getCachedStats, updateCachedStats } = useStatsCache();
  const { 
    requestsUsed, 
    canMakeRequest, 
    incrementRequests, 
    getRemainingRequests, 
    getUsagePercentage 
  } = useStravaRateLimit();

  const isLoadingRef = useRef(false);
  const lastLoadTimeRef = useRef<number>(0);

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
      
      return connected;
    } catch (error) {
      console.error('Error checking Strava connection:', error);
      setIsStravaConnected(false);
      return false;
    }
  };

  const loadCachedStatsInitial = async () => {
    if (!user || isInitialized) return;

    console.log('Chargement initial des stats depuis le cache...');
    
    try {
      const cachedStats = await getCachedStats();

      if (cachedStats) {
        console.log('Stats trouvées dans le cache:', cachedStats);
        setStats(cachedStats);
        setIsInitialized(true);
        return;
      }

      console.log('Pas de cache, calcul initial depuis les activités...');
      await loadStats();
    } catch (error) {
      console.error('Error loading cached stats:', error);
      await loadStats();
    }
  };

  const loadStats = async () => {
    if (!user || !isStravaConnected || isLoadingRef.current) return;

    const now = Date.now();
    if (now - lastLoadTimeRef.current < 1000) {
      return;
    }
    lastLoadTimeRef.current = now;

    isLoadingRef.current = true;
    setLoading(true);
    console.log('Calcul des stats depuis les activités...');
    
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString();
      const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString();

      const { data: monthActivities } = await supabase
        .from('strava_activities')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_date', startOfMonth)
        .lte('start_date', endOfMonth)
        .order('start_date', { ascending: false });

      const startOfYear = new Date(currentYear, 0, 1).toISOString();
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59).toISOString();

      const { data: yearActivities } = await supabase
        .from('strava_activities')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_date', startOfYear)
        .lte('start_date', endOfYear)
        .order('start_date', { ascending: false });

      const { data: latestActivity } = await supabase
        .from('strava_activities')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })
        .limit(1);

      console.log('Activités du mois trouvées:', monthActivities?.length || 0);
      console.log('Activités de l\'année trouvées:', yearActivities?.length || 0);

      const monthlyDistance = monthActivities?.reduce((sum, activity) => sum + (activity.distance / 1000), 0) || 0;
      const monthlyActivitiesCount = monthActivities?.length || 0;
      const monthlyDuration = monthActivities?.reduce((sum, activity) => sum + (activity.moving_time || 0), 0) || 0;
      const longestMonthlyActivity = monthActivities?.reduce((longest, activity) => 
        activity.distance > (longest?.distance || 0) ? activity : longest, null);

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
      
      await updateCachedStats(calculatedStats);
      setStats(calculatedStats);
      setIsInitialized(true);
    } catch (error) {
      console.error('Error loading stats:', error);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  const syncActivities = async () => {
    if (!user || !isStravaConnected) {
      setError('Utilisateur non connecté ou Strava non lié');
      return;
    }

    if (!canMakeRequest) {
      const remaining = getRemainingRequests();
      toast.error(`Limite de requêtes Strava atteinte. ${remaining} requêtes restantes aujourd'hui.`);
      setError(`Limite quotidienne atteinte (${requestsUsed}/1800). Réessayez demain.`);
      return;
    }

    const remaining = getRemainingRequests();
    if (remaining < 50) {
      toast.warning(`Attention: seulement ${remaining} requêtes Strava restantes aujourd'hui.`);
    }

    setIsAutoSyncing(true);
    setLoading(true);
    setError(null);

    try {
      console.log(`Début de synchronisation - Requêtes restantes: ${remaining}`);
      
      const { data, error: functionError } = await supabase.functions.invoke('sync-strava-activities');

      incrementRequests(10);

      if (functionError) {
        console.error('Function error:', functionError);
        
        if (functionError.message?.includes('non-2xx status code')) {
          throw new Error('Erreur de synchronisation Strava. Veuillez réessayer dans quelques minutes.');
        }
        
        throw new Error(functionError.message || 'Erreur lors de la synchronisation');
      }

      if (data?.error) {
        if (data.type === 'rate_limit' || data.error.includes('rate limit')) {
          incrementRequests(50);
          toast.error('Limite de taux Strava atteinte. Veuillez attendre quelques minutes avant de réessayer.');
          setError('Limite de taux Strava atteinte');
          return;
        }
        
        throw new Error(data.error);
      }

      if (data?.stats) {
        await updateCachedStats(data.stats);
        const updatedStats = await getCachedStats();
        if (updatedStats) {
          setStats(updatedStats);
        }
        
        const message = data.message || `${data.activities_synced || 0} activités synchronisées`;
        toast.success(message);
        
        if (data.activities_synced) {
          incrementRequests(Math.min(data.activities_synced * 2, 100));
        }
      } else {
        await loadStats();
        toast.success('Données synchronisées avec succès');
      }

      setLastSyncTime(new Date());
    } catch (error: any) {
      console.error('Error syncing activities:', error);
      let errorMessage = 'Erreur lors de la synchronisation des activités';
      
      if (error.message?.includes('rate limit') || error.message?.includes('429')) {
        incrementRequests(100);
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
      setIsAutoSyncing(false);
    }
  };

  useAutoRefresh({
    onRefresh: loadStats,
    dependencies: [user?.id, isStravaConnected],
    enabled: isStravaConnected && isInitialized
  });

  useEffect(() => {
    if (user && !isInitialized) {
      console.log('Utilisateur connecté, initialisation...');
      checkStravaConnection().then(async (connected) => {
        if (connected) {
          // Force le recalcul des stats depuis la base
          await loadStats();
        }
      });
    } else if (!user) {
      setStats(null);
      setIsStravaConnected(false);
      setIsInitialized(false);
      setIsAutoSyncing(false);
      setLastSyncTime(null);
    }
  }, [user, isInitialized]);

  return {
    stats,
    loading: loading && !stats,
    error,
    syncActivities,
    isStravaConnected,
    loadStats,
    isAutoSyncing,
    lastSyncTime,
    rateLimitInfo: {
      requestsUsed,
      canMakeRequest,
      remainingRequests: getRemainingRequests(),
      usagePercentage: getUsagePercentage()
    }
  };
};
