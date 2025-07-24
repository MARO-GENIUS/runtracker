
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
  // Nouvelles données de carte
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
}

// Cache en mémoire pour les activités
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

  const fetchActivityDetail = useCallback(async (activityId: number) => {
    if (!user) {
      setError('Utilisateur non connecté');
      return;
    }

    // Annuler la requête précédente si elle existe
    if (abortController.current) {
      abortController.current.abort();
    }

    // Créer un nouveau contrôleur d'annulation
    abortController.current = new AbortController();
    const { signal } = abortController.current;

    try {
      setLoading(true);
      setError(null);

      // Vérifier le cache en premier
      if (isCacheValid(activityId)) {
        const cachedActivity = activityCache.get(activityId);
        if (cachedActivity) {
          setActivity(cachedActivity);
          setLoading(false);
          return;
        }
      }

      // Récupérer les données de base (incluant les données de carte)
      const basicData = await fetchBasicActivityData(activityId, signal);
      
      // Récupérer les best efforts en parallèle
      const bestEffortsPromise = fetchBestEfforts(activityId, signal);
      
      // Attendre les best efforts
      const bestEfforts = await bestEffortsPromise;

      const fullActivity: ActivityDetail = {
        ...basicData,
        best_efforts: bestEfforts,
        splits: [], // Sera chargé à la demande
        heart_rate_stream: [] // Sera chargé à la demande
      };

      if (!signal.aborted) {
        setActivity(fullActivity);
        setCacheEntry(activityId, fullActivity);
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
  }, [user, isCacheValid, fetchBasicActivityData, fetchBestEfforts, setCacheEntry]);

  const prefetchActivity = useCallback(async (activityId: number) => {
    if (!user || isCacheValid(activityId)) return;

    try {
      const basicData = await fetchBasicActivityData(activityId);
      const bestEfforts = await fetchBestEfforts(activityId);
      
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

  // Cleanup à la destruction du composant
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
    prefetchActivity
  };
};
