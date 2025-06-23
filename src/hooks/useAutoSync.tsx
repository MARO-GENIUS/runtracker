
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStatsCache } from '@/hooks/useStatsCache';
import { supabase } from '@/integrations/supabase/client';

interface AutoSyncOptions {
  intervalHours?: number;
  syncOnAppStart?: boolean;
  syncOnFocus?: boolean;
}

export const useAutoSync = (options: AutoSyncOptions = {}) => {
  const { intervalHours = 6, syncOnAppStart = true, syncOnFocus = true } = options;
  const { user } = useAuth();
  const { getCachedStats } = useStatsCache();
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour vérifier si une synchronisation est nécessaire
  const needsSync = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // Vérifier l'heure de la dernière synchronisation
      const { data: profile } = await supabase
        .from('profiles')
        .select('updated_at')
        .eq('id', user.id)
        .single();

      if (!profile?.updated_at) return true;

      const lastUpdate = new Date(profile.updated_at);
      const now = new Date();
      const hoursSinceLastSync = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

      return hoursSinceLastSync >= intervalHours;
    } catch (error) {
      console.error('Error checking sync status:', error);
      return true; // En cas d'erreur, on considère qu'une sync est nécessaire
    }
  };

  // Fonction pour effectuer la synchronisation automatique
  const performAutoSync = async () => {
    if (!user || isAutoSyncing) return;

    const shouldSync = await needsSync();
    if (!shouldSync) return;

    setIsAutoSyncing(true);
    console.log('Démarrage de la synchronisation automatique...');

    try {
      const { error } = await supabase.functions.invoke('sync-strava-activities');
      
      if (!error) {
        setLastSyncTime(new Date());
        console.log('Synchronisation automatique réussie');
      } else {
        console.error('Erreur lors de la synchronisation automatique:', error);
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation automatique:', error);
    } finally {
      setIsAutoSyncing(false);
    }
  };

  // Effet pour la synchronisation au démarrage de l'application
  useEffect(() => {
    if (user && syncOnAppStart) {
      // Délai pour éviter les appels simultanés
      const timer = setTimeout(() => {
        performAutoSync();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [user, syncOnAppStart]);

  // Effet pour la synchronisation périodique
  useEffect(() => {
    if (!user) return;

    // Nettoyer l'ancien intervalle
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Créer un nouvel intervalle
    intervalRef.current = setInterval(() => {
      performAutoSync();
    }, intervalHours * 60 * 60 * 1000); // Convertir les heures en millisecondes

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, intervalHours]);

  // Effet pour la synchronisation quand l'utilisateur revient sur l'application
  useEffect(() => {
    if (!syncOnFocus || !user) return;

    const handleFocus = () => {
      // Attendre un peu pour éviter les appels trop fréquents
      setTimeout(() => {
        performAutoSync();
      }, 1000);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        handleFocus();
      }
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [user, syncOnFocus]);

  return {
    isAutoSyncing,
    lastSyncTime,
    performAutoSync,
    needsSync
  };
};
