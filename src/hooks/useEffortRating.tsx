
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UseEffortRatingReturn {
  updateEffortRating: (activityId: number, rating: number, notes: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const useEffortRating = (): UseEffortRatingReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const updateEffortRating = async (activityId: number, rating: number, notes: string) => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Updating effort rating:', { activityId, rating, notes });

      const { error: updateError } = await supabase
        .from('strava_activities')
        .update({
          effort_rating: rating,
          effort_notes: notes.trim() || null
        })
        .eq('id', activityId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating effort rating:', updateError);
        throw new Error(updateError.message);
      }

      console.log('Effort rating updated successfully');
    } catch (error: any) {
      console.error('Error in updateEffortRating:', error);
      setError(error.message || 'Erreur lors de la sauvegarde');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateEffortRating,
    loading,
    error
  };
};
