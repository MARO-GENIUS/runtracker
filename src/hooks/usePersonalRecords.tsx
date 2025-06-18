
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PersonalRecord {
  id: string;
  distance: string;
  time: string;
  pace: string;
  date: string;
  location: string;
  isRecent: boolean;
}

export const usePersonalRecords = () => {
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const formatDistanceType = (distanceMeters: number): string => {
    const km = distanceMeters / 1000;
    
    if (km <= 1) return '1 km';
    if (km <= 3) return '3 km';
    if (km <= 5) return '5 km';
    if (km <= 10) return '10 km';
    if (km <= 15) return '15 km';
    if (km <= 21.1) return 'Semi-marathon';
    if (km <= 42.2) return 'Marathon';
    if (km <= 50) return '50 km';
    if (km <= 100) return '100 km';
    
    return `${Math.round(km)} km`;
  };

  const formatTime = (timeInSeconds: number): string => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatPace = (distanceInMeters: number, timeInSeconds: number): string => {
    const km = distanceInMeters / 1000;
    const paceInSecondsPerKm = timeInSeconds / km;
    const minutes = Math.floor(paceInSecondsPerKm / 60);
    const seconds = Math.round(paceInSecondsPerKm % 60);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isRecentRecord = (dateString: string): boolean => {
    const recordDate = new Date(dateString);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return recordDate > threeMonthsAgo;
  };

  const fetchPersonalRecords = async () => {
    if (!user) {
      setError('Utilisateur non connecté');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: recordsData, error: fetchError } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', user.id)
        .order('distance_meters', { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (recordsData) {
        const formattedRecords: PersonalRecord[] = recordsData.map((record) => ({
          id: record.id,
          distance: formatDistanceType(record.distance_meters),
          time: formatTime(record.time_seconds),
          pace: formatPace(record.distance_meters, record.time_seconds),
          date: formatDate(record.date),
          location: record.location || 'Lieu non spécifié',
          isRecent: isRecentRecord(record.date)
        }));

        setRecords(formattedRecords);
      }

    } catch (error: any) {
      console.error('Error fetching personal records:', error);
      setError(error.message || 'Erreur lors du chargement des records personnels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonalRecords();
  }, [user]);

  return {
    records,
    loading,
    error,
    refetch: fetchPersonalRecords
  };
};
