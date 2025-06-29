
import { AIRecommendation } from '@/hooks/useAICoach';

// Algorithme de correspondance avec tolérance de 5%
export const isActivityMatching = (activity: any, recommendation: AIRecommendation, generatedAt: string): boolean => {
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
export const getAveragePaceByType = (type: string): number => {
  switch (type) {
    case 'recovery': return 7.0;
    case 'endurance': return 6.0;
    case 'tempo': return 5.0;
    case 'intervals': return 4.5;
    case 'long': return 6.5;
    default: return 6.0;
  }
};
