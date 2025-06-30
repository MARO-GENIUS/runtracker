
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { PersistentAIRecommendation } from '@/types/aiRecommendations';
import { AIRecommendation } from './useAICoach';
import { 
  loadPersistentRecommendations, 
  saveRecommendationsToDatabase, 
  markRecommendationAsCompleted,
  deleteRecommendation
} from '@/utils/aiRecommendationDatabase';
import { isActivityMatching } from '@/utils/activityMatcher';

export const usePersistentAIRecommendations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [persistentRecommendations, setPersistentRecommendations] = useState<PersistentAIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Charger les recommandations persistantes
  const loadRecommendations = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const recommendations = await loadPersistentRecommendations(user.id);
      setPersistentRecommendations(recommendations);
    } catch (error: any) {
      console.error('Error loading persistent recommendations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les recommandations sauvegardées",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Sauvegarder de nouvelles recommandations
  const saveRecommendations = useCallback(async (recommendations: AIRecommendation[]) => {
    if (!user || !recommendations.length) return;
    
    try {
      await saveRecommendationsToDatabase(user.id, recommendations);
      
      // Recharger les recommandations après sauvegarde
      await loadRecommendations();
      
      toast({
        title: "Recommandations sauvegardées",
        description: `${recommendations.length} recommandations ajoutées au suivi`,
      });
    } catch (error: any) {
      console.error('Error saving recommendations:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder les recommandations",
        variant: "destructive"
      });
    }
  }, [user, loadRecommendations, toast]);

  // Supprimer une recommandation
  const removeRecommendation = useCallback(async (recommendationId: string) => {
    if (!user) return;
    
    try {
      await deleteRecommendation(recommendationId);
      
      // Mettre à jour localement
      setPersistentRecommendations(prev => 
        prev.filter(rec => rec.id !== recommendationId)
      );
      
      toast({
        title: "Recommandation supprimée",
        description: "La séance proposée a été retirée de votre suivi",
      });
    } catch (error: any) {
      console.error('Error deleting recommendation:', error);
      toast({
        title: "Erreur de suppression",
        description: "Impossible de supprimer la recommandation",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  // Vérifier les correspondances avec les activités
  const checkActivityMatches = useCallback(async (activities: any[]) => {
    if (!user || !activities.length || !persistentRecommendations.length) return;

    const pendingRecommendations = persistentRecommendations.filter(r => r.status === 'pending');
    
    for (const activity of activities) {
      for (const persistentRec of pendingRecommendations) {
        if (isActivityMatching(activity, persistentRec.recommendation_data, persistentRec.generated_at)) {
          try {
            await markRecommendationAsCompleted(persistentRec.id, activity.id);
            
            // Mettre à jour localement
            setPersistentRecommendations(prev => 
              prev.map(rec => 
                rec.id === persistentRec.id 
                  ? { 
                      ...rec, 
                      status: 'completed' as const, 
                      completed_at: new Date().toISOString(),
                      matching_activity_id: activity.id 
                    }
                  : rec
              )
            );

            toast({
              title: "Correspondance détectée !",
              description: `Votre séance "${persistentRec.recommendation_data.title}" a été marquée comme réalisée`,
            });
          } catch (error) {
            console.error('Error marking recommendation as completed:', error);
          }
        }
      }
    }
  }, [user, persistentRecommendations, toast]);

  // Charger au montage
  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  return {
    persistentRecommendations,
    isLoading,
    saveRecommendations,
    removeRecommendation,
    checkActivityMatches,
    loadRecommendations
  };
};
