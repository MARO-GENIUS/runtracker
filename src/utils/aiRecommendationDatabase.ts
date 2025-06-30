
import { supabase } from '@/integrations/supabase/client';
import { AIRecommendation } from '@/hooks/useAICoach';
import { PersistentAIRecommendation } from '@/types/aiRecommendations';

export const loadPersistentRecommendations = async (userId: string): Promise<PersistentAIRecommendation[]> => {
  const { data, error } = await supabase
    .from('ai_recommendations')
    .select('*')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false });

  if (error) throw error;

  // Convertir les données Supabase au format attendu
  const convertedData = (data || []).map(item => ({
    ...item,
    recommendation_data: item.recommendation_data as unknown as AIRecommendation
  })) as PersistentAIRecommendation[];

  return convertedData;
};

export const saveRecommendationsToDatabase = async (userId: string, recommendations: AIRecommendation[]): Promise<void> => {
  if (!recommendations.length) return;

  const recommendationsToSave = recommendations.map(rec => ({
    user_id: userId,
    recommendation_data: rec as any, // Conversion explicite pour Supabase
    status: 'pending' as const
  }));

  const { error } = await supabase
    .from('ai_recommendations')
    .insert(recommendationsToSave);

  if (error) throw error;
};

export const markRecommendationAsCompleted = async (recommendationId: string, activityId: number): Promise<void> => {
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
};

export const deleteRecommendation = async (recommendationId: string): Promise<void> => {
  const { error } = await supabase
    .from('ai_recommendations')
    .delete()
    .eq('id', recommendationId);

  if (error) throw error;
};
