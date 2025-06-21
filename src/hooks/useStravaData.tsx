
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface StravaStats {
  monthly: {
    distance: number;
    activitiesCount: number;
    duration: number; // Ajout de la propriété duration
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
        
        // Handle specific error cases
        if (functionError.message?.includes('non-2xx status code')) {
          throw new Error('Erreur de synchronisation Strava. Veuillez réessayer dans quelques minutes.');
        }
        
        throw new Error(functionError.message || 'Erreur lors de la synchronisation');
      }

      if (data?.error) {
        // Handle rate limiting specifically
        if (data.type === 'rate_limit' || data.error.includes('rate limit')) {
          toast.error('Limite de taux Strava atteinte. Veuillez attendre quelques minutes avant de réessayer.');
          setError('Limite de taux Strava atteinte');
          return;
        }
        
        throw new Error(data.error);
      }

      if (data?.stats) {
        setStats(data.stats);
        
        // Show appropriate success message
        if (data.message) {
          toast.success(data.message);
        } else {
          toast.success(`${data.activities_synced || 0} activités synchronisées`);
        }
        
        // Show additional info if there were issues with best efforts
        if (data.best_efforts_status && !data.best_efforts_status.success) {
          toast.info('Synchronisation partielle - certains détails seront récupérés lors de la prochaine synchronisation');
        }
      }
    } catch (error: any) {
      console.error('Error syncing activities:', error);
      let errorMessage = 'Erreur lors de la synchronisation des activités';
      
      // Handle specific error types
      if (error.message?.includes('rate limit') || error.message?.includes('429')) {
        errorMessage = 'Limite de taux Strava atteinte. Veuillez attendre quelques minutes.';
      } else if (error.message?.includes('token')) {
        errorMessage = 'Problème d\'authentification Strava. Veuillez reconnecter votre compte.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
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
