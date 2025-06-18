
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface StravaStats {
  monthly: {
    distance: number;
    activitiesCount: number;
    longestActivity: {
      name: string;
      distance: number;
      date: string;
    } | null;
  };
  yearly: {
    distance: number;
    activitiesCount: number;
  };
  latest: {
    name: string;
    distance: number;
    date: string;
  } | null;
}

interface UseStravaDataReturn {
  stats: StravaStats | null;
  loading: boolean;
  error: string | null;
  syncActivities: () => Promise<void>;
  isStravaConnected: boolean;
}

export const useStravaData = (): UseStravaDataReturn => {
  const [stats, setStats] = useState<StravaStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStravaConnected, setIsStravaConnected] = useState(false);
  const { user } = useAuth();

  const checkStravaConnection = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('strava_access_token')
        .eq('id', user.id)
        .single();

      setIsStravaConnected(!!profile?.strava_access_token);
    } catch (error) {
      console.error('Error checking Strava connection:', error);
      setIsStravaConnected(false);
    }
  };

  const syncActivities = async () => {
    if (!user || !isStravaConnected) {
      setError('Utilisateur non connecté ou Strava non lié');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('sync-strava-activities');

      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error(functionError.message || 'Erreur lors de la synchronisation');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.stats) {
        setStats(data.stats);
        toast.success(`${data.activities_synced || 0} activités synchronisées`);
      }
    } catch (error: any) {
      console.error('Error syncing activities:', error);
      const errorMessage = error.message || 'Erreur lors de la synchronisation des activités';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkStravaConnection();
    }
  }, [user]);

  return {
    stats,
    loading,
    error,
    syncActivities,
    isStravaConnected
  };
};
