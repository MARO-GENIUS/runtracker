
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { useStatsCache } from './useStatsCache';

interface DeleteActivityOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const useDeleteActivity = (options: DeleteActivityOptions = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { clearCache } = useStatsCache();
  const [isDeleting, setIsDeleting] = useState(false);
  const [undoTimeoutId, setUndoTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const deleteActivityCascade = async (activityId: number) => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    console.log(`Début de la suppression en cascade pour l'activité ${activityId}`);

    try {
      // 1. Supprimer les recommandations IA liées
      const { error: aiRecommendationsError } = await supabase
        .from('ai_recommendations')
        .delete()
        .eq('user_id', user.id)
        .eq('matching_activity_id', activityId);

      if (aiRecommendationsError) {
        console.error('Erreur suppression recommandations IA:', aiRecommendationsError);
      }

      // 2. Supprimer les meilleurs efforts liés
      const { error: bestEffortsError } = await supabase
        .from('strava_best_efforts')
        .delete()
        .eq('user_id', user.id)
        .eq('activity_id', activityId);

      if (bestEffortsError) {
        console.error('Erreur suppression meilleurs efforts:', bestEffortsError);
      }

      // 3. Supprimer les records personnels liés (si cette activité était un record)
      const { error: recordsError } = await supabase
        .from('personal_records')
        .delete()
        .eq('user_id', user.id)
        .eq('activity_id', activityId);

      if (recordsError) {
        console.error('Erreur suppression records personnels:', recordsError);
      }

      // 4. Supprimer l'activité principale
      const { error: activityError } = await supabase
        .from('strava_activities')
        .delete()
        .eq('user_id', user.id)
        .eq('id', activityId);

      if (activityError) {
        throw new Error(`Erreur lors de la suppression de l'activité: ${activityError.message}`);
      }

      // 5. Vider le cache des statistiques pour forcer un recalcul
      await clearCache();

      console.log(`Suppression en cascade terminée pour l'activité ${activityId}`);

    } catch (error: any) {
      console.error('Erreur lors de la suppression en cascade:', error);
      throw error;
    }
  };

  const deleteActivity = async (activityId: number, activityName: string) => {
    setIsDeleting(true);

    try {
      // Suppression immédiate (optimiste)
      await deleteActivityCascade(activityId);

      // Toast de confirmation avec possibilité d'undo (simulation)
      toast({
        title: "Activité supprimée",
        description: `"${activityName}" a été supprimée avec toutes ses données associées.`,
        duration: 8000,
      });

      options.onSuccess?.();

    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      
      const errorMessage = error.message || 'Erreur lors de la suppression de l\'activité';
      
      toast({
        title: "Erreur de suppression",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });

      options.onError?.(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelUndo = () => {
    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId);
      setUndoTimeoutId(null);
    }
  };

  return {
    deleteActivity,
    isDeleting,
    cancelUndo
  };
};
