
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
  // DÉSACTIVÉ: Options par défaut changées pour éviter la synchronisation automatique
  const { intervalHours = 24, syncOnAppStart = false, syncOnFocus = false } = options;
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
      return false; // En cas d'erreur, on ne force pas une sync automatique
    }
  };

  // Fonction pour effectuer la synchronisation automatique - MAINTENANT MANUELLE UNIQUEMENT
  const performAutoSync = async () => {
    if (!user || isAutoSyncing) return;

    setIsAutoSyncing(true);
    console.log('Démarrage de la synchronisation manuelle...');

    try {
      const { error } = await supabase.functions.invoke('sync-strava-activities');
      
      if (!error) {
        setLastSyncTime(new Date());
        console.log('Synchronisation manuelle réussie');
      } else {
        console.error('Erreur lors de la synchronisation manuelle:', error);
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation manuelle:', error);
    } finally {
      setIsAutoSyncing(false);
    }
  };

  // DÉSACTIVÉ: Effet pour la synchronisation au démarrage de l'application
  useEffect(() => {
    if (user && syncOnAppStart) {
      console.log('Synchronisation au démarrage désactivée');
      // Code désactivé pour éviter la sync automatique
      // const timer = setTimeout(() => {
      //   performAutoSync();
      // }, 2000);
      // return () => clearTimeout(timer);
    }
  }, [user, syncOnAppStart]);

  // DÉSACTIVÉ: Effet pour la synchronisation périodique
  useEffect(() => {
    if (!user) return;

    // Nettoyer l'ancien intervalle
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // DÉSACTIVÉ: Ne plus créer d'intervalle automatique
    console.log('Synchronisation périodique désactivée');
    
    // Code désactivé pour éviter la sync automatique
    // intervalRef.current = setInterval(() => {
    //   performAutoSync();
    // }, intervalHours * 60 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, intervalHours]);

  // DÉSACTIVÉ: Effet pour la synchronisation quand l'utilisateur revient sur l'application
  useEffect(() => {
    if (!syncOnFocus || !user) return;

    console.log('Synchronisation au focus désactivée');

    // Code désactivé pour éviter la sync automatique
    // const handleFocus = () => {
    //   setTimeout(() => {
    //     performAutoSync();
    //   }, 1000);
    // };

    // window.addEventListener('focus', handleFocus);
    // document.addEventListener('visibilitychange', () => {
    //   if (!document.hidden) {
    //     handleFocus();
    //   }
    // });

    // return () => {
    //   window.removeEventListener('focus', handleFocus);
    //   document.removeEventListener('visibilitychange', handleFocus);
    // };
  }, [user, syncOnFocus]);

  return {
    isAutoSyncing,
    lastSyncTime,
    performAutoSync, // Fonction disponible pour déclenchement manuel uniquement
    needsSync
  };
};
