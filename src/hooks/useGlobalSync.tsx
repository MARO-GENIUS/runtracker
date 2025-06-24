
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStatsCache } from '@/hooks/useStatsCache';
import { useStravaRateLimit } from '@/hooks/useStravaRateLimit';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GlobalSyncState {
  isGlobalSyncing: boolean;
  lastGlobalSyncTime: Date | null;
  syncProgress: string | null;
}

export const useGlobalSync = () => {
  const [syncState, setSyncState] = useState<GlobalSyncState>({
    isGlobalSyncing: false,
    lastGlobalSyncTime: null,
    syncProgress: null
  });
  
  const { user } = useAuth();
  const { updateCachedStats } = useStatsCache();
  const { canMakeRequest, incrementRequests } = useStravaRateLimit();
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<Date | null>(null);

  // Événements personnalisés pour la synchronisation
  const dispatchSyncEvent = useCallback((type: 'start' | 'progress' | 'complete' | 'error', data?: any) => {
    const event = new CustomEvent(`strava-sync-${type}`, { detail: data });
    window.dispatchEvent(event);
  }, []);

  // Fonction de synchronisation globale
  const performGlobalSync = useCallback(async (isAutomatic = false) => {
    if (!user || syncState.isGlobalSyncing || !canMakeRequest) {
      if (!canMakeRequest) {
        toast.error('Limite API Strava atteinte - Synchronisation reportée');
      }
      return;
    }

    console.log(`Début de synchronisation ${isAutomatic ? 'automatique' : 'manuelle'}`);
    
    setSyncState(prev => ({
      ...prev,
      isGlobalSyncing: true,
      syncProgress: 'Initialisation...'
    }));

    dispatchSyncEvent('start', { isAutomatic });

    try {
      setSyncState(prev => ({ ...prev, syncProgress: 'Synchronisation des activités...' }));
      dispatchSyncEvent('progress', { message: 'Synchronisation des activités...' });

      const { data, error } = await supabase.functions.invoke('sync-strava-activities');
      
      if (error) {
        throw new Error(error.message || 'Erreur lors de la synchronisation');
      }

      // Incrémenter le compteur d'utilisation API
      const requestsUsed = data?.activities_synced ? Math.min(data.activities_synced * 2, 50) : 10;
      incrementRequests(requestsUsed);

      if (data?.stats) {
        setSyncState(prev => ({ ...prev, syncProgress: 'Mise à jour du cache...' }));
        await updateCachedStats(data.stats);
      }

      const syncTime = new Date();
      lastSyncRef.current = syncTime;
      
      setSyncState(prev => ({
        ...prev,
        lastGlobalSyncTime: syncTime,
        syncProgress: null
      }));

      const message = isAutomatic 
        ? `Synchronisation automatique terminée - ${data?.activities_synced || 0} activités` 
        : `${data?.activities_synced || 0} activités synchronisées`;

      if (!isAutomatic) {
        toast.success(message);
      }

      console.log(message);
      dispatchSyncEvent('complete', { 
        activitiesSynced: data?.activities_synced || 0,
        stats: data?.stats,
        isAutomatic 
      });

    } catch (error: any) {
      console.error('Erreur synchronisation globale:', error);
      
      let errorMessage = 'Erreur lors de la synchronisation';
      
      if (error.message?.includes('rate limit') || error.message?.includes('429')) {
        incrementRequests(100);
        errorMessage = 'Limite API Strava atteinte';
      } else if (error.message?.includes('token')) {
        errorMessage = 'Problème d\'authentification Strava';
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (!isAutomatic) {
        toast.error(errorMessage);
      }

      setSyncState(prev => ({ ...prev, syncProgress: null }));
      dispatchSyncEvent('error', { error: errorMessage, isAutomatic });
    } finally {
      setSyncState(prev => ({ ...prev, isGlobalSyncing: false }));
    }
  }, [user, syncState.isGlobalSyncing, canMakeRequest, updateCachedStats, incrementRequests, dispatchSyncEvent]);

  // Synchronisation automatique périodique (toutes les 30 minutes)
  useEffect(() => {
    if (!user) return;

    const startPeriodicSync = () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }

      syncIntervalRef.current = setInterval(() => {
        const now = new Date();
        const lastSync = lastSyncRef.current;
        
        // Vérifier qu'au moins 30 minutes se sont écoulées
        if (!lastSync || (now.getTime() - lastSync.getTime()) >= 30 * 60 * 1000) {
          console.log('Déclenchement de la synchronisation automatique périodique');
          performGlobalSync(true);
        }
      }, 30 * 60 * 1000); // 30 minutes
    };

    // Synchronisation initiale au démarrage (avec délai)
    const initialTimer = setTimeout(() => {
      console.log('Synchronisation initiale au démarrage');
      performGlobalSync(true);
      startPeriodicSync();
    }, 3000);

    return () => {
      clearTimeout(initialTimer);
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [user, performGlobalSync]);

  // Synchronisation sur focus de la fenêtre
  useEffect(() => {
    if (!user) return;

    const handleFocus = () => {
      const now = new Date();
      const lastSync = lastSyncRef.current;
      
      // Synchroniser seulement si plus de 15 minutes depuis la dernière sync
      if (!lastSync || (now.getTime() - lastSync.getTime()) >= 15 * 60 * 1000) {
        console.log('Synchronisation sur retour de focus');
        setTimeout(() => performGlobalSync(true), 2000);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleFocus();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, performGlobalSync]);

  return {
    ...syncState,
    performGlobalSync: () => performGlobalSync(false),
    performAutoSync: () => performGlobalSync(true)
  };
};
