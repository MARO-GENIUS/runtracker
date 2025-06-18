
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface StravaActivity {
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
}

interface UseActivitiesOptions {
  page?: number;
  limit?: number;
  sortBy?: 'start_date' | 'distance' | 'moving_time';
  sortOrder?: 'asc' | 'desc';
  searchTerm?: string;
}

interface UseActivitiesReturn {
  activities: StravaActivity[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  hasMore: boolean;
  refetch: () => Promise<void>;
}

export const useActivities = (options: UseActivitiesOptions = {}): UseActivitiesReturn => {
  const {
    page = 1,
    limit = 20,
    sortBy = 'start_date',
    sortOrder = 'desc',
    searchTerm = ''
  } = options;

  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const { user } = useAuth();

  const fetchActivities = async () => {
    if (!user) {
      setError('Utilisateur non connecté');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build the query
      let query = supabase
        .from('strava_activities')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Add search filter if provided
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      // Add pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        console.error('Error fetching activities:', fetchError);
        throw new Error(fetchError.message);
      }

      setActivities(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error('Error in fetchActivities:', error);
      setError(error.message || 'Erreur lors du chargement des activités');
      toast.error('Erreur lors du chargement des activités');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [user, page, limit, sortBy, sortOrder, searchTerm]);

  const hasMore = totalCount > page * limit;

  return {
    activities,
    loading,
    error,
    totalCount,
    hasMore,
    refetch: fetchActivities
  };
};
