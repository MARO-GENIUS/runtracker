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
      const detailData = {
        activity_id: activityId,
        user_id: user.id,
        session_type: sessionType,
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
    } catch (error) {
      console.error('Error saving workout details:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
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
      setWorkoutDetail(null);
      toast.success('Détails supprimés');
    } catch (error) {
      console.error('Error deleting workout details:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
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