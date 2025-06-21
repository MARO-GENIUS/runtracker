
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ActivityDetail {
  id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number | null;
  start_date: string;
  start_date_local: string;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  average_speed: number | null;
  max_speed: number | null;
  average_heartrate: number | null;
  max_heartrate: number | null;
  suffer_score: number | null;
  calories: number | null;
  best_efforts?: any[];
  splits?: any[];
}

interface UseActivityDetailReturn {
  activity: ActivityDetail | null;
  loading: boolean;
  error: string | null;
  fetchActivityDetail: (activityId: number) => Promise<void>;
}

export const useActivityDetail = (): UseActivityDetailReturn => {
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchActivityDetail = async (activityId: number) => {
    if (!user) {
      setError('Utilisateur non connecté');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch basic activity data from our database
      const { data: activityData, error: fetchError } = await supabase
        .from('strava_activities')
        .select('*')
        .eq('user_id', user.id)
        .eq('id', activityId)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setActivity(activityData);

      // Fetch additional details (best efforts, splits) via edge function if available
      try {
        const { data: detailData, error: detailError } = await supabase.functions.invoke('get-activity-details', {
          body: { activityId }
        });

        if (!detailError && detailData) {
          setActivity(prev => prev ? {
            ...prev,
            best_efforts: detailData.best_efforts || [],
            splits: detailData.splits || []
          } : null);
        }
      } catch (detailError) {
        console.log('Could not fetch additional activity details:', detailError);
        // This is not a critical error, continue with basic data
      }

    } catch (error: any) {
      console.error('Error fetching activity detail:', error);
      setError(error.message || 'Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  return {
    activity,
    loading,
    error,
    fetchActivityDetail
  };
};
