
import { useState, useEffect, useCallback, useRef } from 'react';
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
  heart_rate_stream?: any[];
  // Map data
  map_polyline?: string | null;
  map_summary_polyline?: string | null;
  start_latlng?: string | null;
  end_latlng?: string | null;
}

interface UseOptimizedActivityDetailReturn {
  activity: ActivityDetail | null;
  loading: boolean;
  error: string | null;
  fetchActivityDetail: (activityId: number) => Promise<void>;
  prefetchActivity: (activityId: number) => void;
  loadHeartRateData: (activityId: number) => Promise<void>;
}

// Cache management
const activityCache = new Map<number, ActivityDetail>();
const cacheExpiry = new Map<number, number>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useOptimizedActivityDetail = (): UseOptimizedActivityDetailReturn => {
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const abortController = useRef<AbortController | null>(null);

  const isCacheValid = useCallback((activityId: number): boolean => {
    const expiry = cacheExpiry.get(activityId);
    return expiry ? Date.now() < expiry : false;
  }, []);

  const setCacheEntry = useCallback((activityId: number, data: ActivityDetail) => {
    activityCache.set(activityId, data);
    cacheExpiry.set(activityId, Date.now() + CACHE_DURATION);
  }, []);

  const fetchBasicActivityData = useCallback(async (activityId: number, signal?: AbortSignal): Promise<ActivityDetail> => {
    if (!user) throw new Error('Utilisateur non connecté');

    console.log(`Fetching basic activity data for ${activityId}`);

    const { data: activityData, error: fetchError } = await supabase
      .from('strava_activities')
      .select(`
        *,
        map_polyline,
        map_summary_polyline,
        start_latlng,
        end_latlng
      `)
      .eq('user_id', user.id)
      .eq('id', activityId)
      .single();

    if (signal?.aborted) throw new Error('Request aborted');
    if (fetchError) throw new Error(fetchError.message);

    console.log('Basic activity data fetched:', {
      id: activityData.id,
      average_heartrate: activityData.average_heartrate,
      max_heartrate: activityData.max_heartrate,
      hasMapData: !!(activityData.map_polyline || activityData.map_summary_polyline)
    });

    return activityData;
  }, [user]);

  const fetchBestEfforts = useCallback(async (activityId: number, signal?: AbortSignal) => {
    if (!user) return [];

    const { data: bestEffortsData, error: bestEffortsError } = await supabase
      .from('strava_best_efforts')
      .select('*')
      .eq('user_id', user.id)
      .eq('activity_id', activityId)
      .order('distance', { ascending: true });

    if (signal?.aborted) throw new Error('Request aborted');
    if (bestEffortsError) {
      console.error('Error fetching best efforts:', bestEffortsError);
      return [];
    }

    return bestEffortsData || [];
  }, [user]);

  const loadHeartRateData = useCallback(async (activityId: number) => {
    if (!user) return;

    try {
      console.log(`Loading heart rate data for activity ${activityId}`);
      
      const { data, error } = await supabase.functions.invoke('get-activity-details', {
        body: { activityId }
      });

      if (error) {
        console.error('Error loading heart rate data:', error);
        return;
      }

      if (data?.success && data.heart_rate_stream) {
        console.log('Heart rate data loaded:', {
          streamLength: data.heart_rate_stream.length,
          sample: data.heart_rate_stream.slice(0, 3)
        });

        // Update activity with heart rate stream data
        setActivity(prev => {
          if (!prev) return null;
          
          const updatedActivity = {
            ...prev,
            heart_rate_stream: data.heart_rate_stream || [],
            splits: data.splits || prev.splits || []
          };
          
          // Update cache
          setCacheEntry(activityId, updatedActivity);
          
          return updatedActivity;
        });
      }
    } catch (error) {
      console.error('Error loading heart rate data:', error);
    }
  }, [user, setCacheEntry]);

  const fetchActivityDetail = useCallback(async (activityId: number) => {
    if (!user) {
      setError('Utilisateur non connecté');
      return;
    }

    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }

    abortController.current = new AbortController();
    const { signal } = abortController.current;

    try {
      setLoading(true);
      setError(null);

      // Check cache first
      if (isCacheValid(activityId)) {
        const cachedActivity = activityCache.get(activityId);
        if (cachedActivity) {
          console.log('Using cached activity data');
          setActivity(cachedActivity);
          setLoading(false);
          
          // Load heart rate data in background if not present
          if (!cachedActivity.heart_rate_stream || cachedActivity.heart_rate_stream.length === 0) {
            loadHeartRateData(activityId);
          }
          
          return;
        }
      }

      // Fetch basic data and best efforts in parallel
      const [basicData, bestEfforts] = await Promise.all([
        fetchBasicActivityData(activityId, signal),
        fetchBestEfforts(activityId, signal)
      ]);

      const fullActivity: ActivityDetail = {
        ...basicData,
        best_efforts: bestEfforts,
        splits: [],
        heart_rate_stream: []
      };

      if (!signal.aborted) {
        setActivity(fullActivity);
        setCacheEntry(activityId, fullActivity);
        
        // Load additional data in background
        loadHeartRateData(activityId);
      }

    } catch (error: any) {
      if (error.message !== 'Request aborted') {
        console.error('Error fetching activity detail:', error);
        setError(error.message || 'Erreur lors du chargement des détails');
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [user, isCacheValid, fetchBasicActivityData, fetchBestEfforts, setCacheEntry, loadHeartRateData]);

  const prefetchActivity = useCallback(async (activityId: number) => {
    if (!user || isCacheValid(activityId)) return;

    try {
      const [basicData, bestEfforts] = await Promise.all([
        fetchBasicActivityData(activityId),
        fetchBestEfforts(activityId)
      ]);
      
      const fullActivity: ActivityDetail = {
        ...basicData,
        best_efforts: bestEfforts,
        splits: [],
        heart_rate_stream: []
      };

      setCacheEntry(activityId, fullActivity);
    } catch (error) {
      console.error('Error prefetching activity:', error);
    }
  }, [user, isCacheValid, fetchBasicActivityData, fetchBestEfforts, setCacheEntry]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  return {
    activity,
    loading,
    error,
    fetchActivityDetail,
    prefetchActivity,
    loadHeartRateData
  };
};
