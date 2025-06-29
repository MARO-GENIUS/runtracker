
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { AIRecommendation } from './useAICoach';

interface PersistentAIRecommendation {
  id: string;
  user_id: string;
  recommendation_data: AIRecommendation;
  generated_at: string;
  completed_at?: string;
  matching_activity_id?: number;
  status: 'pending' | 'completed' | 'expired';
  created_at: string;
  updated_at: string;
}

export const usePersistentAIRecommendations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [persistentRecommendations, setPersistentRecommendations] = useState<PersistentAIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Charger les recommandations persistantes
  const loadPersistentRecommendations = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false });

      if (error) throw error;

      // Convertir les données Supabase au format attendu
      const convertedData = (data || []).map(item => ({
        ...item,
        recommendation_data: item.recommendation_data as unknown as AIRecommendation
      })) as PersistentAIRecommendation[];

      setPersistentRecommendations(convertedData);
    } catch (error: any) {
      console.error('Error loading persistent recommendations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les recommandations persistantes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sauvegarder de nouvelles recommandations
  const saveRecommendations = async (recommendations: AIRecommendation[]) => {
    if (!user || !recommendations.length) return;

    try {
      const recommendationsToSave = recommendations.map(rec => ({
        user_id: user.id,
        recommendation_data: rec as any, // Conversion explicite pour Supabase
        status: 'pending' as const
      }));

      const { error } = await supabase
        .from('ai_recommendations')
        .insert(recommendationsToSave);

      if (error) throw error;

      await loadPersistentRecommendations();
      
      toast({
        title: "Recommandations sauvegardées",
        description: `${recommendations.length} recommandations ont été sauvegardées`,
      });
    } catch (error: any) {
      console.error('Error saving recommendations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les recommandations",
        variant: "destructive"
      });
    }
  };

  // Marquer une recommandation comme terminée
  const markAsCompleted = async (recommendationId: string, activityId: number) => {
    try {
      const { error } = await supabase
        .from('ai_recommendations')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          matching_activity_id: activityId,
          updated_at: new Date().toISOString()
        })
        .eq('id', recommendationId);

      if (error) throw error;

      await loadPersistentRecommendations();
    } catch (error: any) {
      console.error('Error marking recommendation as completed:', error);
    }
  };

  // Vérifier les correspondances avec les activités Strava
  const checkActivityMatches = async (activities: any[]) => {
    if (!activities.length || !persistentRecommendations.length) return;

    const pendingRecommendations = persistentRecommendations.filter(r => r.status === 'pending');
    
    for (const recommendation of pendingRecommendations) {
      const recData = recommendation.recommendation_data;
      
      for (const activity of activities) {
        if (isActivityMatching(activity, recData, recommendation.generated_at)) {
          await markAsCompleted(recommendation.id, activity.id);
          
          toast({
            title: "Recommandation réalisée ! 🎉",
            description: `Votre séance "${recData.title}" a été détectée dans l'activité "${activity.name}"`,
          });
          break;
        }
      }
    }
  };

  // Algorithme de correspondance avec tolérance de 5%
  const isActivityMatching = (activity: any, recommendation: AIRecommendation, generatedAt: string): boolean => {
    // Vérifier que l'activité a eu lieu après la génération de la recommandation
    const activityDate = new Date(activity.start_date);
    const recommendationDate = new Date(generatedAt);
    const daysSinceRecommendation = (activityDate.getTime() - recommendationDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceRecommendation < 0 || daysSinceRecommendation > 7) return false;

    // Vérification de la distance (tolérance 5%)
    const activityDistanceKm = activity.distance / 1000;
    const recommendedDurationMin = recommendation.duration;
    
    // Estimer la distance recommandée basée sur la durée et l'allure cible
    let estimatedDistanceKm = 0;
    if (recommendation.targetPace) {
      // Extraire l'allure moyenne du format "5:30-6:00 min/km"
      const paceMatch = recommendation.targetPace.match(/(\d+):(\d+)/);
      if (paceMatch) {
        const avgPaceMin = parseInt(paceMatch[1]) + parseInt(paceMatch[2]) / 60;
        estimatedDistanceKm = recommendedDurationMin / avgPaceMin;
      }
    } else {
      // Estimation basée sur le type d'entraînement
      const avgPace = getAveragePaceByType(recommendation.type);
      estimatedDistanceKm = recommendedDurationMin / avgPace;
    }

    // Tolérance de 5% sur la distance
    const distanceTolerance = 0.05;
    const minDistance = estimatedDistanceKm * (1 - distanceTolerance);
    const maxDistance = estimatedDistanceKm * (1 + distanceTolerance);
    
    if (activityDistanceKm < minDistance || activityDistanceKm > maxDistance) return false;

    // Vérification de la durée (tolérance 5%)
    const activityDurationMin = activity.moving_time / 60;
    const durationTolerance = 0.05;
    const minDuration = recommendedDurationMin * (1 - durationTolerance);
    const maxDuration = recommendedDurationMin * (1 + durationTolerance);
    
    if (activityDurationMin < minDuration || activityDurationMin > maxDuration) return false;

    // Vérification optionnelle de la fréquence cardiaque
    if (recommendation.targetHR && activity.average_heartrate) {
      const hrTolerance = 0.1; // 10% de tolérance pour la FC
      const minHR = recommendation.targetHR.min * (1 - hrTolerance);
      const maxHR = recommendation.targetHR.max * (1 + hrTolerance);
      
      if (activity.average_heartrate < minHR || activity.average_heartrate > maxHR) {
        return false;
      }
    }

    return true;
  };

  // Obtenir l'allure moyenne par type d'entraînement (en min/km)
  const getAveragePaceByType = (type: string): number => {
    switch (type) {
      case 'recovery': return 7.0;
      case 'endurance': return 6.0;
      case 'tempo': return 5.0;
      case 'intervals': return 4.5;
      case 'long': return 6.5;
      default: return 6.0;
    }
  };

  useEffect(() => {
    if (user) {
      loadPersistentRecommendations();
    }
  }, [user]);

  return {
    persistentRecommendations,
    isLoading,
    saveRecommendations,
    checkActivityMatches,
    loadPersistentRecommendations
  };
};
