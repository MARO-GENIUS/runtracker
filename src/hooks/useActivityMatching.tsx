
import { useEffect } from 'react';
import { useActivities } from './useActivities';
import { usePersistentAIRecommendations } from './usePersistentAIRecommendations';
import { useAuth } from './useAuth';

export const useActivityMatching = () => {
  const { user } = useAuth();
  const { activities } = useActivities({ limit: 50 }); // Récupérer les 50 dernières activités
  const { checkActivityMatches } = usePersistentAIRecommendations();

  useEffect(() => {
    if (user && activities.length > 0) {
      // Vérifier les correspondances automatiquement quand de nouvelles activités sont chargées
      checkActivityMatches(activities);
    }
  }, [activities, user, checkActivityMatches]);

  return null; // Ce hook ne retourne rien, il fonctionne en arrière-plan
};
