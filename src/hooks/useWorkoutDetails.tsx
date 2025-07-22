
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { WorkoutData } from '@/types/workoutTypes';
import { toast } from 'sonner';

interface WorkoutDetail {
  id: string;
  activity_id: number;
  user_id: string;
  session_type: string;
  workout_data: any;
  created_at: string;
  updated_at: string;
}

export const useWorkoutDetails = (activityId?: number) => {
  const { user } = useAuth();
  const [workoutDetail, setWorkoutDetail] = useState<WorkoutDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);

  // Mémoiser la fonction de récupération pour éviter les re-rendus
  const fetchWorkoutDetail = useCallback(async (forceRefresh = false) => {
    if (!user || !activityId) {
      console.log('[useWorkoutDetails] Cannot fetch: missing user or activityId', { user: !!user, activityId });
      return;
    }

    // Éviter les requêtes multiples simultanées
    if (loading) {
      console.log('[useWorkoutDetails] Already loading, skipping fetch');
      return;
    }

    setLoading(true);
    setSaveSuccess(null);
    
    try {
      console.log(`[useWorkoutDetails] Fetching workout details for activity ${activityId}`);
      
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
      
    } catch (error) {
      console.error('[useWorkoutDetails] Error fetching workout details:', error);
      setSaveSuccess(false);
    } finally {
      setLoading(false);
    }
  }, [user, activityId, loading]);

  const saveWorkoutDetail = useCallback(async (sessionType: string, workoutData: WorkoutData): Promise<boolean> => {
    if (!user || !activityId) {
      console.error('[useWorkoutDetails] Cannot save: missing user or activityId');
      toast.error('Erreur: Utilisateur non connecté ou activité invalide');
      setSaveSuccess(false);
      return false;
    }

    console.log('[useWorkoutDetails] Starting save operation:', { 
      sessionType, 
      workoutData, 
      activityId, 
      userId: user.id,
      hasExisting: !!workoutDetail 
    });
    
    try {
      const normalizedSessionType = normalizeSessionType(sessionType);
      
      const detailData = {
        activity_id: activityId,
        user_id: user.id,
        session_type: normalizedSessionType,
        workout_data: workoutData as any
      };

      let result;
      
      if (workoutDetail) {
        console.log('[useWorkoutDetails] Updating existing workout detail');
        
        const { data, error } = await supabase
          .from('workout_details')
          .update({ 
            session_type: normalizedSessionType,
            workout_data: workoutData as any,
            updated_at: new Date().toISOString() 
          })
          .eq('id', workoutDetail.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          console.error('[useWorkoutDetails] Update error:', error);
          throw error;
        }
        result = data;
        
      } else {
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
      }
      
      // Mettre à jour le type de session de l'activité
      await updateActivitySessionType(activityId, normalizedSessionType);
      
      // Mettre à jour l'état local
      setWorkoutDetail(result);
      setSaveSuccess(true);
      
      console.log('[useWorkoutDetails] Save operation completed successfully');
      return true;
      
    } catch (error) {
      console.error('[useWorkoutDetails] Error saving workout details:', error);
      toast.error('Erreur lors de la sauvegarde des détails');
      setSaveSuccess(false);
      return false;
    }
  }, [user, activityId, workoutDetail]);

  const updateActivitySessionType = async (activityId: number, sessionType: string) => {
    try {
      const { error } = await supabase
        .from('strava_activities')
        .update({ session_type: sessionType })
        .eq('id', activityId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('[useWorkoutDetails] Error updating activity session type:', error);
      }
    } catch (error) {
      console.error('[useWorkoutDetails] Error updating activity session type:', error);
    }
  };

  const deleteWorkoutDetail = useCallback(async () => {
    if (!workoutDetail) return;

    try {
      const { error } = await supabase
        .from('workout_details')
        .delete()
        .eq('id', workoutDetail.id);

      if (error) throw error;
      
      await supabase
        .from('strava_activities')
        .update({ session_type: null })
        .eq('id', workoutDetail.activity_id)
        .eq('user_id', user?.id);
        
      setWorkoutDetail(null);
      console.log('[useWorkoutDetails] Successfully deleted workout detail');
    } catch (error) {
      console.error('[useWorkoutDetails] Error deleting workout details:', error);
      throw error;
    }
  }, [workoutDetail, user]);
  
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

  // Récupérer les données lors du changement d'activité
  useEffect(() => {
    if (user && activityId) {
      fetchWorkoutDetail();
    } else {
      setWorkoutDetail(null);
      setSaveSuccess(null);
    }
  }, [activityId, user?.id, fetchWorkoutDetail]);

  return {
    workoutDetail,
    loading,
    saveSuccess,
    saveWorkoutDetail,
    deleteWorkoutDetail,
    refetch: () => fetchWorkoutDetail(true)
  };
};
