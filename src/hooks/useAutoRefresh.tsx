
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
  const isRefreshingRef = useRef(false);
  const scrollPositionRef = useRef(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Mettre à jour la référence quand la fonction change
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const saveScrollPosition = () => {
    scrollPositionRef.current = window.scrollY;
  };

  const restoreScrollPosition = () => {
    // Utiliser requestAnimationFrame pour s'assurer que le DOM est rendu
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPositionRef.current);
    });
  };

  const handleRefresh = useCallback(async () => {
    if (!enabled || isRefreshingRef.current) return;
    
    // Débouncer les appels multiples
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      isRefreshingRef.current = true;
      saveScrollPosition();
      
      try {
        await onRefreshRef.current();
        // Restaurer la position après un court délai pour laisser le DOM se mettre à jour
        setTimeout(restoreScrollPosition, 100);
      } catch (error) {
        console.error('Erreur lors du rafraîchissement automatique:', error);
      } finally {
        isRefreshingRef.current = false;
      }
    }, 300); // Débounce de 300ms
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
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [handleRefresh, enabled]);

  // Rafraîchir quand les dépendances changent (mais pas au premier rendu)
  const isFirstRenderRef = useRef(true);
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    
    if (enabled && dependencies.length > 0) {
      handleRefresh();
    }
  }, [...dependencies, enabled]);

  // Nettoyer au démontage
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return { refresh: handleRefresh };
};
