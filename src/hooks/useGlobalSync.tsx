
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
  const autoSyncingRef = useRef(false);

  // Événements personnalisés pour la synchronisation
  const dispatchSyncEvent = useCallback((type: 'start' | 'progress' | 'complete' | 'error', data?: any) => {
    const event = new CustomEvent(`strava-sync-${type}`, { detail: data });
    window.dispatchEvent(event);
  }, []);

  // Fonction de synchronisation globale
  const performGlobalSync = useCallback(async (isAutomatic = false) => {
    if (!user || (!isAutomatic && syncState.isGlobalSyncing) || (isAutomatic && autoSyncingRef.current) || !canMakeRequest) {
      if (!canMakeRequest && !isAutomatic) {
        toast.error('Limite API Strava atteinte - Synchronisation reportée');
      }
      return;
    }

    console.log(`Début de synchronisation ${isAutomatic ? 'automatique' : 'manuelle'}`);
    
    if (isAutomatic) {
      autoSyncingRef.current = true;
    }
    
    setSyncState(prev => ({
      ...prev,
      isGlobalSyncing: isAutomatic ? prev.isGlobalSyncing : true,
      syncProgress: isAutomatic ? prev.syncProgress : 'Initialisation...'
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
      // Persist last sync time for cross-hook UI updates
      try {
        localStorage.setItem('last_strava_sync', syncTime.toISOString());
      } catch {}
      
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
      if (isAutomatic) {
        autoSyncingRef.current = false;
      }
      setSyncState(prev => ({ ...prev, isGlobalSyncing: false }));
    }
  }, [user, syncState.isGlobalSyncing, canMakeRequest, updateCachedStats, incrementRequests, dispatchSyncEvent]);

  // Synchronisation automatique périodique (toutes les 60 minutes, silencieuse)
  useEffect(() => {
    if (!user) return;

    // Initialiser depuis le stockage local pour éviter une sync inutile au démarrage
    try {
      const saved = localStorage.getItem('last_strava_sync');
      if (saved) {
        const d = new Date(saved);
        if (!isNaN(d.getTime())) {
          lastSyncRef.current = d;
        }
      }
    } catch {}

    const startPeriodicSync = () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }

      syncIntervalRef.current = setInterval(() => {
        const now = new Date();
        const lastSync = lastSyncRef.current;
        
        // Vérifier qu'au moins 60 minutes se sont écoulées
        if (!lastSync || (now.getTime() - lastSync.getTime()) >= 60 * 60 * 1000) {
          console.log('Déclenchement de la synchronisation automatique périodique');
          performGlobalSync(true);
        }
      }, 60 * 60 * 1000); // 60 minutes
    };

    // Synchronisation initiale au démarrage (avec délai et seuil 60 min)
    const initialTimer = setTimeout(() => {
      const now = new Date();
      const lastSync = lastSyncRef.current;
      if (!lastSync || (now.getTime() - lastSync.getTime()) >= 60 * 60 * 1000) {
        console.log('Synchronisation initiale au démarrage');
        performGlobalSync(true);
      }
      startPeriodicSync();
    }, 3000);

    return () => {
      clearTimeout(initialTimer);
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [user, performGlobalSync]);

  // Synchronisation sur focus désactivée pour réduire l'animation inutile
  useEffect(() => {
    if (!user) return;
    // Intentionnellement désactivé
  }, [user, performGlobalSync]);

  return {
    ...syncState,
    performGlobalSync: () => performGlobalSync(false),
    performAutoSync: () => performGlobalSync(true)
  };
};
