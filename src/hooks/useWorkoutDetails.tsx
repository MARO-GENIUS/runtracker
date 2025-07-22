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
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);

  const fetchWorkoutDetail = async (forceRefresh = false) => {
    if (!user || !activityId) {
      console.log('[useWorkoutDetails] Cannot fetch: missing user or activityId', { user: !!user, activityId });
      return;
    }

    setLoading(true);
    setSaveSuccess(null);
    
    try {
      console.log(`[useWorkoutDetails] Fetching workout details for activity ${activityId} and user ${user.id}`);
      
      const { data, error } = await supabase
        .from('workout_details')
        .select('*')
        .eq('activity_id', activityId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[useWorkoutDetails] Supabase error:', error);
        throw error;
      }
      
      console.log('[useWorkoutDetails] Fetched workout detail:', data);
      setWorkoutDetail(data);
      
      if (data) {
        console.log('[useWorkoutDetails] Found existing workout data:', data.workout_data);
      } else {
        console.log('[useWorkoutDetails] No existing workout details found for this activity');
      }
      
    } catch (error) {
      console.error('[useWorkoutDetails] Error fetching workout details:', error);
      toast.error('Erreur lors du chargement des détails');
      setSaveSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const saveWorkoutDetail = async (sessionType: string, workoutData: WorkoutData): Promise<boolean> => {
    if (!user || !activityId) {
      console.error('[useWorkoutDetails] Cannot save: missing user or activityId', { user: !!user, activityId });
      toast.error('Erreur: Utilisateur non connecté ou activité invalide');
      setSaveSuccess(false);
      return false;
    }

    setLoading(true);
    setSaveSuccess(null);
    
    try {
      console.log('[useWorkoutDetails] Saving workout details:', { 
        sessionType, 
        workoutData, 
        activityId, 
        userId: user.id,
        hasExisting: !!workoutDetail 
      });
      
      // Normalize session type for storage consistency
      const normalizedSessionType = normalizeSessionType(sessionType);
      
      const detailData = {
        activity_id: activityId,
        user_id: user.id,
        session_type: normalizedSessionType,
        workout_data: workoutData as any
      };

      let result;
      
      if (workoutDetail) {
        // Update existing
        console.log('[useWorkoutDetails] Updating existing workout detail with ID:', workoutDetail.id);
        
        const { data, error } = await supabase
          .from('workout_details')
          .update({ 
            session_type: normalizedSessionType,
            workout_data: workoutData as any,
            updated_at: new Date().toISOString() 
          })
          .eq('id', workoutDetail.id)
          .eq('user_id', user.id) // Additional security check
          .select()
          .single();

        if (error) {
          console.error('[useWorkoutDetails] Update error:', error);
          throw error;
        }
        result = data;
        console.log('[useWorkoutDetails] Successfully updated workout detail:', data);
        
      } else {
        // Create new
        console.log('[useWorkoutDetails] Creating new workout detail');
        
        const { data, error } = await supabase
          .from('workout_details')
          .insert(detailData)
          .select()
          .single();

        if (error) {
          console.error('[useWorkoutDetails] Insert error:', error);
          throw error;
        }
        result = data;
        console.log('[useWorkoutDetails] Successfully created workout detail:', data);
      }
      
      // Update the activity's session type
      await updateActivitySessionType(activityId, normalizedSessionType);
      
      // Update local state immediately
      setWorkoutDetail(result);
      
      // Show success message
      toast.success('Détails d\'entraînement sauvegardés');
      setSaveSuccess(true);
      
      console.log('[useWorkoutDetails] Save operation completed successfully');
      return true;
      
    } catch (error) {
      console.error('[useWorkoutDetails] Error saving workout details:', error);
      toast.error('Erreur lors de la sauvegarde des détails');
      setSaveSuccess(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateActivitySessionType = async (activityId: number, sessionType: string) => {
    try {
      console.log('[useWorkoutDetails] Updating activity session type:', { activityId, sessionType });
      
      const { error } = await supabase
        .from('strava_activities')
        .update({ session_type: sessionType })
        .eq('id', activityId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('[useWorkoutDetails] Error updating activity session type:', error);
      } else {
        console.log('[useWorkoutDetails] Successfully updated activity session type');
      }
    } catch (error) {
      console.error('[useWorkoutDetails] Error updating activity session type:', error);
    }
  };

  const deleteWorkoutDetail = async () => {
    if (!workoutDetail) return;

    setLoading(true);
    try {
      console.log('[useWorkoutDetails] Deleting workout detail with ID:', workoutDetail.id);
      
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
      console.log('[useWorkoutDetails] Successfully deleted workout detail');
    } catch (error) {
      console.error('[useWorkoutDetails] Error deleting workout details:', error);
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

  // Fetch data when activityId or user changes
  useEffect(() => {
    if (user && activityId) {
      console.log('[useWorkoutDetails] Effect triggered - fetching data for activity:', activityId);
      fetchWorkoutDetail();
    } else {
      console.log('[useWorkoutDetails] Effect triggered - clearing data (no user or activityId)');
      setWorkoutDetail(null);
      setSaveSuccess(null);
    }
  }, [activityId, user?.id]); // Only depend on user.id to avoid unnecessary refetches

  return {
    workoutDetail,
    loading,
    saveSuccess,
    saveWorkoutDetail,
    deleteWorkoutDetail,
    refetch: () => fetchWorkoutDetail(true)
  };
};
