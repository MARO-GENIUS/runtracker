import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface StravaData30Days {
  date: string;
  distance_km: number;
  duration_minutes: number;
  average_pace_min_per_km: string;
  average_heart_rate: number | null;
  max_heart_rate: number | null;
  average_power: number | null;
  effort_type: string;
  training_load: number | null;
  rpe: number | null;
}

interface PersonalRecordsData {
  '5K': string | null;
  '10K': string | null;
  'Semi': string | null;
  'Marathon': string | null;
}

interface CurrentGoal {
  distance: string;
  target_time: string;
  target_date: string;
}

interface Last30DaysData {
  activities: StravaData30Days[];
  personalRecords: PersonalRecordsData;
  currentGoal: CurrentGoal | null;
  lastSessionType: string | null;
  loading: boolean;
  error: string | null;
  updateLastSessionType: (newType: string) => Promise<void>;
}

export const useStravaLast30Days = (): Last30DaysData => {
  const [data, setData] = useState<Last30DaysData>({
    activities: [],
    personalRecords: { '5K': null, '10K': null, 'Semi': null, 'Marathon': null },
    currentGoal: null,
    lastSessionType: null,
    loading: true,
    error: null,
    updateLastSessionType: async () => {}
  });
  
  const { user } = useAuth();

  const formatPace = (distanceMeters: number, timeSeconds: number): string => {
    if (distanceMeters === 0) return '0:00';
    const paceSeconds = timeSeconds / (distanceMeters / 1000);
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.round(paceSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const determineEffortType = (activity: any): string => {
    // Logique basée sur l'allure, la durée et les données FC
    const paceSeconds = activity.moving_time / (activity.distance / 1000);
    const avgPaceMinPerKm = paceSeconds / 60;
    
    if (activity.distance >= 15000) return 'sortie longue';
    if (avgPaceMinPerKm < 4.5) return 'intervalle';
    if (avgPaceMinPerKm < 5.5 && activity.distance < 8000) return 'seuil';
    if (avgPaceMinPerKm > 6.5) return 'récupération';
    return 'footing';
  };

  const updateLastSessionType = async (newType: string) => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      console.log('Mise à jour du type de séance:', newType);
      
      // Stocker le type dans les paramètres d'entraînement
      const { error } = await supabase
        .from('training_settings')
        .upsert({
          user_id: user.id,
          last_session_type: newType,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }

      // Mettre à jour immédiatement l'état local
      setData(prev => ({
        ...prev,
        lastSessionType: newType
      }));

      console.log('Type de séance mis à jour avec succès:', newType);
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du type de séance:', error);
      throw error;
    }
  };

  const fetchLast30DaysData = async () => {
    if (!user) return;

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: activities, error: activitiesError } = await supabase
        .from('strava_activities')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_date_local', thirtyDaysAgo.toISOString())
        .order('start_date_local', { ascending: false });

      if (activitiesError) throw activitiesError;

      const formattedActivities: StravaData30Days[] = (activities || []).map(activity => ({
        date: new Date(activity.start_date_local).toISOString().split('T')[0],
        distance_km: parseFloat((activity.distance / 1000).toFixed(2)),
        duration_minutes: parseFloat((activity.moving_time / 60).toFixed(1)),
        average_pace_min_per_km: formatPace(activity.distance, activity.moving_time),
        average_heart_rate: activity.average_heartrate,
        max_heart_rate: activity.max_heartrate,
        average_power: null,
        effort_type: determineEffortType(activity),
        training_load: activity.suffer_score,
        rpe: activity.effort_rating
      }));

      const { data: records } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', user.id);

      const personalRecords: PersonalRecordsData = { '5K': null, '10K': null, 'Semi': null, 'Marathon': null };
      
      records?.forEach(record => {
        const minutes = Math.floor(record.time_seconds / 60);
        const seconds = record.time_seconds % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (record.distance_meters === 5000) personalRecords['5K'] = timeString;
        if (record.distance_meters === 10000) personalRecords['10K'] = timeString;
        if (record.distance_meters === 21097) personalRecords['Semi'] = timeString;
        if (record.distance_meters === 42195) personalRecords['Marathon'] = timeString;
      });

      const { data: trainingSettings } = await supabase
        .from('training_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      let currentGoal: CurrentGoal | null = null;
      let lastSessionType: string | null = null;

      if (trainingSettings) {
        const raceLabels = {
          '5k': '5 kilomètres',
          '10k': '10 kilomètres',
          'semi': 'Semi-marathon',
          'marathon': 'Marathon',
          'recuperation': 'Récupération/Forme'
        };
        
        currentGoal = {
          distance: raceLabels[trainingSettings.target_race as keyof typeof raceLabels] || trainingSettings.target_race,
          target_time: trainingSettings.target_time_minutes ? 
            `${Math.floor(trainingSettings.target_time_minutes / 60)}:${(trainingSettings.target_time_minutes % 60).toString().padStart(2, '0')}` : 
            'Non défini',
          target_date: trainingSettings.target_date ? 
            new Date(trainingSettings.target_date).toLocaleDateString('fr-FR') : 
            'Non définie'
        };

        // Récupérer le type de dernière séance stocké
        lastSessionType = (trainingSettings as any).last_session_type || null;
      }

      // Si pas de type stocké, utiliser le type de la dernière activité
      if (!lastSessionType && formattedActivities.length > 0) {
        lastSessionType = formattedActivities[0].effort_type;
      }

      setData({
        activities: formattedActivities,
        personalRecords,
        currentGoal,
        lastSessionType,
        loading: false,
        error: null,
        updateLastSessionType
      });

    } catch (error: any) {
      console.error('Erreur lors de la récupération des données:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erreur lors de la récupération des données',
        updateLastSessionType
      }));
    }
  };

  useEffect(() => {
    fetchLast30DaysData();
  }, [user]);

  return data;
};
