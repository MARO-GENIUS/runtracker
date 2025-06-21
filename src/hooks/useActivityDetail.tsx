
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

      console.log(`Fetching activity detail for ${activityId}`);

      // Fetch basic activity data from our database
      const { data: activityData, error: fetchError } = await supabase
        .from('strava_activities')
        .select('*')
        .eq('user_id', user.id)
        .eq('id', activityId)
        .single();

      if (fetchError) {
        console.error('Error fetching basic activity data:', fetchError);
        throw new Error(fetchError.message);
      }

      console.log('Basic activity data fetched:', activityData);
      setActivity(activityData);

      // Fetch additional details (best efforts, splits) via edge function
      try {
        console.log('Calling edge function for detailed data...');
        const { data: detailData, error: detailError } = await supabase.functions.invoke('get-activity-details', {
          body: { activityId }
        });

        console.log('Edge function response:', detailData);

        if (detailError) {
          console.error('Edge function error:', detailError);
        } else if (detailData?.success) {
          console.log('Updating activity with detailed data:', {
            best_efforts: detailData.best_efforts?.length || 0,
            splits: detailData.splits?.length || 0
          });
          
          setActivity(prev => prev ? {
            ...prev,
            best_efforts: detailData.best_efforts || [],
            splits: detailData.splits || []
          } : null);
        }
      } catch (detailError) {
        console.error('Could not fetch additional activity details:', detailError);
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
