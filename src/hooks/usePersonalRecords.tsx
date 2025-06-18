
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  formatDistanceType, 
  formatTimeFromSeconds, 
  formatPace, 
  formatDate, 
  isRecentRecord 
} from '@/utils/activityHelpers';

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
          time: formatTimeFromSeconds(record.time_seconds),
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
