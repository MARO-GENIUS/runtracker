
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { WorkoutData } from '@/types/workoutTypes';
import { toast } from 'sonner';

interface WorkoutDetail {
  id: string;
  activity_id: number;
  user_id: string;
  session_type: string;
  workout_data: any; // Use any for Supabase JSON type
  created_at: string;
  updated_at: string;
}

export const useWorkoutDetails = (activityId?: number) => {
  const { user } = useAuth();
  const [workoutDetail, setWorkoutDetail] = useState<WorkoutDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWorkoutDetail = async () => {
    if (!user || !activityId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workout_details')
        .select('*')
        .eq('activity_id', activityId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setWorkoutDetail(data);
    } catch (error) {
      console.error('Error fetching workout details:', error);
      toast.error('Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  const saveWorkoutDetail = async (sessionType: string, workoutData: WorkoutData) => {
    if (!user || !activityId) return;

    setLoading(true);
    try {
      // Normalize session type for storage consistency
      const normalizedSessionType = normalizeSessionType(sessionType);
      
      const detailData = {
        activity_id: activityId,
        user_id: user.id,
        session_type: normalizedSessionType,
        workout_data: workoutData as any
      };

      if (workoutDetail) {
        // Update existing
        const { data, error } = await supabase
          .from('workout_details')
          .update({ ...detailData, updated_at: new Date().toISOString() })
          .eq('id', workoutDetail.id)
          .select()
          .single();

        if (error) throw error;
        setWorkoutDetail(data);
        toast.success('Détails d\'entraînement mis à jour');
      } else {
        // Create new
        const { data, error } = await supabase
          .from('workout_details')
          .insert(detailData)
          .select()
          .single();

        if (error) throw error;
        setWorkoutDetail(data);
        toast.success('Détails d\'entraînement sauvegardés');
      }
      
      // Update the activity's session type
      await updateActivitySessionType(activityId, normalizedSessionType);
      
    } catch (error) {
      console.error('Error saving workout details:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const updateActivitySessionType = async (activityId: number, sessionType: string) => {
    try {
      await supabase
        .from('strava_activities')
        .update({ session_type: sessionType })
        .eq('id', activityId)
        .eq('user_id', user?.id);
    } catch (error) {
      console.error('Error updating activity session type:', error);
    }
  };

  const deleteWorkoutDetail = async () => {
    if (!workoutDetail) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('workout_details')
        .delete()
        .eq('id', workoutDetail.id);

      if (error) throw error;
      
      // Also clear the session_type in the activity
      await supabase
        .from('strava_activities')
        .update({ session_type: null })
        .eq('id', workoutDetail.activity_id)
        .eq('user_id', user?.id);
        
      setWorkoutDetail(null);
      toast.success('Détails supprimés');
    } catch (error) {
      console.error('Error deleting workout details:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to normalize session type
  const normalizeSessionType = (type: string): string => {
    if (!type) return 'endurance';
    
    type = type.toLowerCase().trim();
    
    if (type.includes('interval') || type.includes('fractionn') || type === 'intervalles') {
      return 'intervals';
    } else if (type.includes('seuil') || type === 'threshold') {
      return 'threshold';
    } else if (type.includes('endurance') || type === 'easy' || type === 'fondamentale') {
      return 'endurance';
    } else if (type.includes('tempo')) {
      return 'tempo';
    } else if (type.includes('côte') || type.includes('hill') || type.includes('cote')) {
      return 'hills';
    } else if (type.includes('fartlek')) {
      return 'fartlek';
    } else if (type.includes('récup') || type.includes('recovery') || type.includes('recup')) {
      return 'recovery';
    } else if (type.includes('long') || type.includes('sortie longue')) {
      return 'long';
    }
    
    return type;
  };

  useEffect(() => {
    fetchWorkoutDetail();
  }, [activityId, user]);

  return {
    workoutDetail,
    loading,
    saveWorkoutDetail,
    deleteWorkoutDetail,
    refetch: fetchWorkoutDetail
  };
};
