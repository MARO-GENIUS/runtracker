
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EnhancedMetrics {
  avgElevationGainPerKm?: string;
  heartRateVariability?: string;
  effortZones?: {
    zone1: number;
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
  };
  primaryZone?: string;
  paceConsistency?: string;
  avgCadence?: number;
  hasCadenceData?: boolean;
}

interface EnhancedActivityData {
  activity: any;
  streams: {
    time: number[];
    heartrate: number[];
    cadence: number[];
    distance: number[];
    altitude: number[];
    velocity: number[];
    grade: number[];
  };
  derivedMetrics: EnhancedMetrics;
  best_efforts: any[];
  splits: any[];
}

interface UseEnhancedMetricsReturn {
  enhancedData: EnhancedActivityData | null;
  loading: boolean;
  error: string | null;
  fetchEnhancedData: (activityId: number) => Promise<void>;
}

export const useEnhancedMetrics = (): UseEnhancedMetricsReturn => {
  const [enhancedData, setEnhancedData] = useState<EnhancedActivityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchEnhancedData = async (activityId: number) => {
    if (!user) {
      setError('Utilisateur non connecté');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`Fetching enhanced data for activity ${activityId}`);

      const { data, error: functionError } = await supabase.functions.invoke('get-enhanced-activity-details', {
        body: { activityId }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Erreur lors de la récupération des données');
      }

      if (data?.success) {
        setEnhancedData({
          activity: data.activity,
          streams: data.streams,
          derivedMetrics: data.derivedMetrics || {},
          best_efforts: data.best_efforts || [],
          splits: data.splits || []
        });
      } else {
        throw new Error('Données indisponibles');
      }

    } catch (error: any) {
      console.error('Error fetching enhanced metrics:', error);
      setError(error.message || 'Erreur lors du chargement des métriques avancées');
    } finally {
      setLoading(false);
    }
  };

  return {
    enhancedData,
    loading,
    error,
    fetchEnhancedData
  };
};
