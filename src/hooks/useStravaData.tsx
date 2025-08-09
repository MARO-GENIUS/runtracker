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
  const { getCachedStats, updateCachedStats, clearCache } = useStatsCache();
  const { 
    requestsUsed, 
    canMakeRequest, 
    incrementRequests, 
    getRemainingRequests, 
    getUsagePercentage 
  } = useStravaRateLimit();

  const isLoadingRef = useRef(false);
  const lastLoadTimeRef = useRef<number>(0);
  const isUpdatingCacheRef = useRef(false);
  const activitiesChannelRef = useRef<ReturnType<typeof supabase['channel']> | null>(null);
  const channelIdRef = useRef<string>(Math.random().toString(36).slice(2));
  const subscribedRef = useRef(false);

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

  const initializeStats = async () => {
    if (!user || isInitialized) return;

    console.log('Initialisation: chargement du cache puis recalcul...');
    
    try {
      // D'abord charger le cache pour affichage immédiat
      const cachedStats = await getCachedStats();
      
      if (cachedStats) {
        console.log('Stats trouvées dans le cache, affichage immédiat:', cachedStats);
        setStats(cachedStats);
        setIsInitialized(true);
      }
      
      // Vérifier si le cache est récent (moins de 10 minutes)
      const shouldRecalculate = true; // Pour l'instant, toujours recalculer en arrière-plan
      
      if (shouldRecalculate) {
        console.log('Recalcul des stats en arrière-plan...');
        // Recalculer en arrière-plan sans affecter l'affichage immédiat
        setTimeout(async () => {
          await loadStatsBackground();
        }, 100);
      }
      
      // Si pas de cache, recalcul immédiat
      if (!cachedStats) {
        console.log('Pas de cache, calcul immédiat...');
        await loadStats();
      }
    } catch (error) {
      console.error('Error during initialization:', error);
      setError('Erreur lors de l\'initialisation des données');
    }
  };

  const loadStatsBackground = async () => {
    if (!user || !isStravaConnected) return;

    console.log('Recalcul en arrière-plan des stats...');
    
    try {
      // Utiliser start_date_local comme dans loadStats() pour cohérence
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // Bornes correctes: [début du mois, début du mois suivant)
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const startOfNextMonth = new Date(currentYear, currentMonth + 1, 1);
      const startOfMonthStr = startOfMonth.toISOString().slice(0, 10);
      const startOfNextMonthStr = startOfNextMonth.toISOString().slice(0, 10);

      console.log(`Recherche activités du mois: ${startOfMonthStr} à ${startOfNextMonthStr} (exclu)`);

      const { data: monthActivities } = await supabase
        .from('strava_activities')
        .select('distance,moving_time,name,start_date_local')
        .eq('user_id', user.id)
        .in('type', ['Run','VirtualRun'])
        .gte('start_date_local', startOfMonthStr)
        .lt('start_date_local', startOfNextMonthStr)
        .order('start_date_local', { ascending: false });

      // Bornes correctes: [début de l'année, début de l'année suivante)
      const startOfYearStr = new Date(currentYear, 0, 1).toISOString().slice(0, 10);
      const startOfNextYearStr = new Date(currentYear + 1, 0, 1).toISOString().slice(0, 10);

      console.log(`Recherche activités de l'année: ${startOfYearStr} à ${startOfNextYearStr} (exclu)`);

      const { data: yearActivities } = await supabase
        .from('strava_activities')
        .select('distance,moving_time,start_date_local')
        .eq('user_id', user.id)
        .in('type', ['Run','VirtualRun'])
        .gte('start_date_local', startOfYearStr)
        .lt('start_date_local', startOfNextYearStr)
        .order('start_date_local', { ascending: false });

      const { data: latestActivity } = await supabase
        .from('strava_activities')
        .select('name,distance,start_date_local')
        .eq('user_id', user.id)
        .in('type', ['Run','VirtualRun'])
        .order('start_date_local', { ascending: false })
        .limit(1);

      console.log(`Activités trouvées - Mois: ${monthActivities?.length || 0}, Année: ${yearActivities?.length || 0}`);

      const monthlyDistance = monthActivities?.reduce((sum, activity) => sum + (activity.distance / 1000), 0) || 0;
      const monthlyActivitiesCount = monthActivities?.length || 0;
      const monthlyDuration = monthActivities?.reduce((sum, activity) => sum + (activity.moving_time || 0), 0) || 0;
      const longestMonthlyActivity = monthActivities?.reduce((longest, activity) => 
        activity.distance > (longest?.distance || 0) ? activity : longest, null);

      const yearlyDistance = yearActivities?.reduce((sum, activity) => sum + (activity.distance / 1000), 0) || 0;
      const yearlyActivitiesCount = yearActivities?.length || 0;

      const newStats: StravaStats = {
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

      console.log('Stats recalculées en arrière-plan:', {
        monthly: `${newStats.monthly.distance}km (${newStats.monthly.activitiesCount} activités)`,
        yearly: `${newStats.yearly.distance}km (${newStats.yearly.activitiesCount} activités)`
      });

      // Comparer avec les stats actuelles (plus de critères de comparaison)
      const currentStats = stats;
      const hasChanged = !currentStats || 
        currentStats.monthly.distance !== newStats.monthly.distance ||
        currentStats.monthly.activitiesCount !== newStats.monthly.activitiesCount ||
        currentStats.yearly.distance !== newStats.yearly.distance ||
        currentStats.yearly.activitiesCount !== newStats.yearly.activitiesCount;

      if (hasChanged && !isUpdatingCacheRef.current) {
        console.log('Nouvelles stats détectées, mise à jour:', {
          anciennes: currentStats ? {
            monthly: `${currentStats.monthly.distance}km (${currentStats.monthly.activitiesCount})`,
            yearly: `${currentStats.yearly.distance}km (${currentStats.yearly.activitiesCount})`
          } : 'aucune',
          nouvelles: {
            monthly: `${newStats.monthly.distance}km (${newStats.monthly.activitiesCount})`,
            yearly: `${newStats.yearly.distance}km (${newStats.yearly.activitiesCount})`
          }
        });
        
        isUpdatingCacheRef.current = true;
        try {
          await updateCachedStats(newStats);
          setStats(newStats);
          // Dispatch event pour informer les autres composants
          window.dispatchEvent(new CustomEvent('strava-stats-updated', { detail: newStats }));
        } finally {
          isUpdatingCacheRef.current = false;
        }
      } else {
        console.log(hasChanged ? 'Mise à jour en cours, ignorée' : 'Aucun changement détecté dans les stats');
      }
      
    } catch (error) {
      console.error('Error in background stats calculation:', error);
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
      // Utiliser start_date_local pour correspondre aux dates réelles des activités
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // Bornes correctes: [début du mois, début du mois suivant)
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const startOfNextMonth = new Date(currentYear, currentMonth + 1, 1);
      const startOfMonthStr = startOfMonth.toISOString().slice(0, 10);
      const startOfNextMonthStr = startOfNextMonth.toISOString().slice(0, 10);

      console.log(`Recherche activités du mois: ${startOfMonthStr} à ${startOfNextMonthStr} (exclu)`);

      const { data: monthActivities } = await supabase
        .from('strava_activities')
        .select('distance,moving_time,name,start_date_local')
        .eq('user_id', user.id)
        .in('type', ['Run','VirtualRun'])
        .gte('start_date_local', startOfMonthStr)
        .lt('start_date_local', startOfNextMonthStr)
        .order('start_date_local', { ascending: false });

      // Bornes correctes: [début de l'année, début de l'année suivante)
      const startOfYearStr = new Date(currentYear, 0, 1).toISOString().slice(0, 10);
      const startOfNextYearStr = new Date(currentYear + 1, 0, 1).toISOString().slice(0, 10);

      console.log(`Recherche activités de l'année: ${startOfYearStr} à ${startOfNextYearStr} (exclu)`);

      const { data: yearActivities } = await supabase
        .from('strava_activities')
        .select('distance,moving_time,start_date_local')
        .eq('user_id', user.id)
        .in('type', ['Run','VirtualRun'])
        .gte('start_date_local', startOfYearStr)
        .lt('start_date_local', startOfNextYearStr)
        .order('start_date_local', { ascending: false });

      const { data: latestActivity } = await supabase
        .from('strava_activities')
        .select('name,distance,start_date_local')
        .eq('user_id', user.id)
        .in('type', ['Run','VirtualRun'])
        .order('start_date_local', { ascending: false })
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
          console.log('Connexion Strava détectée, initialisation avec nettoyage...');
          await initializeStats();
        }
      });
    } else if (!user) {
      setStats(null);
      setIsStravaConnected(false);
      setIsInitialized(false);
      setIsAutoSyncing(false);
      setLastSyncTime(null);
      setError(null);
    }
  }, [user, isInitialized]);

  // Listen to global sync events and initialize last sync time
  useEffect(() => {
    // Initialize from localStorage if available
    try {
      const saved = localStorage.getItem('last_strava_sync');
      if (saved) {
        const d = new Date(saved);
        if (!isNaN(d.getTime())) setLastSyncTime(d);
      }
    } catch {}

    const handleStart = () => setIsAutoSyncing(true);
    const handleComplete = () => {
      setIsAutoSyncing(false);
      const now = new Date();
      setLastSyncTime(now);
      // Forcer un recalcul après une sync globale
      loadStatsBackground();
    };
    const handleError = () => setIsAutoSyncing(false);

    window.addEventListener('strava-sync-start', handleStart as EventListener);
    window.addEventListener('strava-sync-complete', handleComplete as EventListener);
    window.addEventListener('strava-sync-error', handleError as EventListener);

    return () => {
      window.removeEventListener('strava-sync-start', handleStart as EventListener);
      window.removeEventListener('strava-sync-complete', handleComplete as EventListener);
      window.removeEventListener('strava-sync-error', handleError as EventListener);
    };
  }, [user?.id]);

  // Realtime: recalculer dès qu'une activité change (INSERT/UPDATE/DELETE)
  useEffect(() => {
    if (!user || !isStravaConnected) return;

    // Toujours nettoyer un ancien canal avant d'en créer un nouveau
    if (activitiesChannelRef.current) {
      try { supabase.removeChannel(activitiesChannelRef.current); } catch {}
      activitiesChannelRef.current = null;
    }

    let timeoutId: number | undefined;
    const schedule = () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        loadStatsBackground();
      }, 300);
    };

    const channelName = `strava-activities-${user.id}-${channelIdRef.current}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'strava_activities', filter: `user_id=eq.${user.id}` },
        schedule
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'strava_activities', filter: `user_id=eq.${user.id}` },
        schedule
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'strava_activities', filter: `user_id=eq.${user.id}` },
        schedule
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          subscribedRef.current = true;
        }
      });

    activitiesChannelRef.current = channel;

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      subscribedRef.current = false;
      if (activitiesChannelRef.current === channel) {
        try { supabase.removeChannel(channel); } catch {}
        activitiesChannelRef.current = null;
      }
    };
  }, [user?.id, isStravaConnected]);

  // Fallback: recalcul périodique pour garantir la fraîcheur des données
  useEffect(() => {
    if (!user || !isStravaConnected) return;
    const id = window.setInterval(() => {
      loadStatsBackground();
    }, 2 * 60 * 1000); // toutes les 2 minutes
    return () => window.clearInterval(id);
  }, [user?.id, isStravaConnected]);

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
