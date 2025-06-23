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
  effort_rating?: number | null;
  effort_notes?: string | null;
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

      // Fetch basic activity data from our database (including effort rating)
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

      console.log('Basic activity data fetched:', {
        id: activityData.id,
        effort_rating: activityData.effort_rating,
        effort_notes: activityData.effort_notes
      });

      // Fetch best efforts from our local database
      const { data: bestEffortsData, error: bestEffortsError } = await supabase
        .from('strava_best_efforts')
        .select('*')
        .eq('user_id', user.id)
        .eq('activity_id', activityId)
        .order('distance', { ascending: true });

      if (bestEffortsError) {
        console.error('Error fetching best efforts:', bestEffortsError);
      }

      console.log('Best efforts fetched from database:', {
        count: bestEffortsData?.length || 0,
        efforts: bestEffortsData
      });

      // Set initial activity data with local best efforts
      const activityWithBestEfforts = {
        ...activityData,
        best_efforts: bestEffortsData || [],
        splits: [] // Will be populated from edge function if available
      };

      setActivity(activityWithBestEfforts);

      // Try to fetch additional details (splits) via edge function as a secondary source
      try {
        console.log('Calling edge function for additional data...');
        const { data: detailData, error: detailError } = await supabase.functions.invoke('get-activity-details', {
          body: { activityId }
        });

        console.log('Edge function response:', detailData);

        if (detailError) {
          console.error('Edge function error:', detailError);
        } else if (detailData?.success) {
          console.log('Updating activity with edge function data:', {
            api_best_efforts: detailData.best_efforts?.length || 0,
            splits: detailData.splits?.length || 0
          });
          
          // Only update splits from edge function, keep local best efforts
          setActivity(prev => prev ? {
            ...prev,
            splits: detailData.splits || []
          } : null);

          // If we have API best efforts but no local ones, store them
          if (detailData.best_efforts?.length > 0 && (!bestEffortsData || bestEffortsData.length === 0)) {
            console.log('Storing new best efforts from API');
            const bestEffortsToInsert = detailData.best_efforts.map((effort: any) => ({
              user_id: user.id,
              activity_id: activityId,
              name: effort.name,
              distance: effort.distance,
              moving_time: effort.moving_time,
              elapsed_time: effort.elapsed_time || effort.moving_time,
              start_date_local: effort.start_date_local
            }));

            const { error: insertError } = await supabase
              .from('strava_best_efforts')
              .insert(bestEffortsToInsert);

            if (insertError) {
              console.error('Error storing best efforts:', insertError);
            } else {
              // Update activity with new best efforts
              setActivity(prev => prev ? {
                ...prev,
                best_efforts: detailData.best_efforts
              } : null);
            }
          }
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
