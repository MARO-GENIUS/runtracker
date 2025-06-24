
import { useEffect, useCallback, useRef } from 'react';

interface UseAutoRefreshOptions {
  onRefresh: () => void | Promise<void>;
  dependencies?: any[];
  enabled?: boolean;
}

export const useAutoRefresh = ({ 
  onRefresh, 
  dependencies = [], 
  enabled = true 
}: UseAutoRefreshOptions) => {
  const onRefreshRef = useRef(onRefresh);
  
  // Mettre à jour la référence quand la fonction change
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const handleRefresh = useCallback(async () => {
    if (!enabled) return;
    
    try {
      await onRefreshRef.current();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement automatique:', error);
    }
  }, [enabled]);

  // Écouter les événements de synchronisation
  useEffect(() => {
    if (!enabled) return;

    const handleSyncComplete = (event: CustomEvent) => {
      console.log('Rafraîchissement automatique déclenché par synchronisation');
      handleRefresh();
    };

    window.addEventListener('strava-sync-complete', handleSyncComplete as EventListener);

    return () => {
      window.removeEventListener('strava-sync-complete', handleSyncComplete as EventListener);
    };
  }, [handleRefresh, enabled]);

  // Rafraîchir quand les dépendances changent
  useEffect(() => {
    if (enabled && dependencies.length > 0) {
      handleRefresh();
    }
  }, [...dependencies, enabled]);

  return { refresh: handleRefresh };
};
