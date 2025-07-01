
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useManualActivityAssociation = () => {
  const { toast } = useToast();
  const [isAssociating, setIsAssociating] = useState(false);

  const associateActivityToRecommendation = async (
    recommendationId: string, 
    activityId: number,
    activityName: string,
    recommendationTitle: string
  ) => {
    setIsAssociating(true);
    
    try {
      const { error } = await supabase
        .from('ai_recommendations')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          matching_activity_id: activityId,
          is_manual_match: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', recommendationId);

      if (error) throw error;

      toast({
        title: "Association réussie !",
        description: `"${activityName}" a été associée à "${recommendationTitle}"`,
      });

      return true;
    } catch (error: any) {
      console.error('Error associating activity:', error);
      toast({
        title: "Erreur d'association",
        description: "Impossible d'associer l'activité à cette recommandation",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsAssociating(false);
    }
  };

  const dissociateActivityFromRecommendation = async (
    recommendationId: string,
    recommendationTitle: string
  ) => {
    setIsAssociating(true);
    
    try {
      const { error } = await supabase
        .from('ai_recommendations')
        .update({
          status: 'pending',
          completed_at: null,
          matching_activity_id: null,
          is_manual_match: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', recommendationId);

      if (error) throw error;

      toast({
        title: "Association supprimée",
        description: `"${recommendationTitle}" est maintenant en attente d'association`,
      });

      return true;
    } catch (error: any) {
      console.error('Error dissociating activity:', error);
      toast({
        title: "Erreur de dissociation",
        description: "Impossible de supprimer l'association",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsAssociating(false);
    }
  };

  return {
    associateActivityToRecommendation,
    dissociateActivityFromRecommendation,
    isAssociating
  };
};
