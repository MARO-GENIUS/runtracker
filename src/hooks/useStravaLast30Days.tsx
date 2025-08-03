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
  '400m': string | null;
  '800m': string | null;
  '1km': string | null;
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

interface LastSessionData {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  start_date_local: string;
  average_heartrate: number | null;
  session_type: string | null;
  location_city: string | null;
}

interface Last30DaysData {
  activities: StravaData30Days[];
  personalRecords: PersonalRecordsData;
  currentGoal: CurrentGoal | null;
  lastSession: LastSessionData | null;
  loading: boolean;
  error: string | null;
}

export const useStravaLast30Days = (): Last30DaysData => {
  const [data, setData] = useState<Last30DaysData>({
    activities: [],
    personalRecords: { '400m': null, '800m': null, '1km': null, '5K': null, '10K': null, 'Semi': null, 'Marathon': null },
    currentGoal: null,
    lastSession: null,
    loading: true,
    error: null
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
    const paceSeconds = activity.moving_time / (activity.distance / 1000);
    const avgPaceMinPerKm = paceSeconds / 60;
    const distanceKm = activity.distance / 1000;
    const avgHR = activity.average_heartrate;
    const maxHR = activity.max_heartrate;
    
    // Récupération active
    if (avgPaceMinPerKm > 7 || (avgHR && avgHR < 130)) return 'récupération';
    
    // Sortie longue (>15km ou >90min)
    if (distanceKm >= 15 || activity.moving_time > 5400) return 'sortie longue';
    
    // Intervalles courts (allure rapide + FC élevée)
    if (avgPaceMinPerKm < 4.5 || (maxHR && avgHR && (maxHR - avgHR) > 20)) return 'intervalles VMA';
    
    // Seuil/Tempo (allure modérément élevée, effort soutenu)
    if (avgPaceMinPerKm < 5.5 && distanceKm < 12 && activity.moving_time < 3600) return 'seuil/tempo';
    
    // Côtes (dépend de l'élévation)
    if (activity.total_elevation_gain && activity.total_elevation_gain > distanceKm * 50) return 'côtes/fartlek';
    
    // Footing d'endurance par défaut
    return 'footing endurance';
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

      // Récupération de la dernière séance (plus récente)
      const lastSession: LastSessionData | null = activities && activities.length > 0 ? {
        id: activities[0].id,
        name: activities[0].name,
        distance: activities[0].distance,
        moving_time: activities[0].moving_time,
        start_date_local: activities[0].start_date_local,
        average_heartrate: activities[0].average_heartrate,
        session_type: activities[0].session_type,
        location_city: activities[0].location_city
      } : null;

      const { data: records } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', user.id);

      const personalRecords: PersonalRecordsData = { '400m': null, '800m': null, '1km': null, '5K': null, '10K': null, 'Semi': null, 'Marathon': null };
      
      records?.forEach(record => {
        const minutes = Math.floor(record.time_seconds / 60);
        const seconds = Math.round(record.time_seconds % 60);
        const timeString = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`;
        
        if (record.distance_meters === 400) personalRecords['400m'] = timeString;
        if (record.distance_meters === 800) personalRecords['800m'] = timeString;
        if (record.distance_meters === 1000) personalRecords['1km'] = timeString;
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
      }

      setData({
        activities: formattedActivities,
        personalRecords,
        currentGoal,
        lastSession,
        loading: false,
        error: null
      });

    } catch (error: any) {
      console.error('Erreur lors de la récupération des données:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erreur lors de la récupération des données'
      }));
    }
  };

  useEffect(() => {
    fetchLast30DaysData();
  }, [user]);

  return data;
};
