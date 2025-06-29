
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TrainingSettings {
  targetRace: 'recuperation' | '5k' | '10k' | 'semi' | 'marathon';
  targetDate?: Date;
  weeklyFrequency: number;
  preferredDays: string[];
  availableTimeSlots: string[];
  maxIntensity: 'low' | 'medium' | 'high';
}

const defaultSettings: TrainingSettings = {
  targetRace: '10k',
  weeklyFrequency: 3,
  preferredDays: ['Lundi', 'Mercredi', 'Samedi'],
  availableTimeSlots: ['Matin (6h-9h)'],
  maxIntensity: 'medium'
};

export const useTrainingSettingsPersistence = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<TrainingSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from database on component mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('training_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading training settings:', error);
          return;
        }

        if (data) {
          const loadedSettings: TrainingSettings = {
            targetRace: data.target_race as TrainingSettings['targetRace'],
            targetDate: data.target_date ? new Date(data.target_date) : undefined,
            weeklyFrequency: data.weekly_frequency,
            preferredDays: data.preferred_days || [],
            availableTimeSlots: data.available_time_slots || [],
            maxIntensity: data.max_intensity as TrainingSettings['maxIntensity']
          };
          setSettings(loadedSettings);
        }
      } catch (error) {
        console.error('Error loading training settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  // Save settings to database
  const saveSettings = async (newSettings: TrainingSettings) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour sauvegarder vos paramètres",
        variant: "destructive"
      });
      return false;
    }

    try {
      const settingsToSave = {
        user_id: user.id,
        target_race: newSettings.targetRace,
        target_date: newSettings.targetDate?.toISOString(),
        weekly_frequency: newSettings.weeklyFrequency,
        preferred_days: newSettings.preferredDays,
        available_time_slots: newSettings.availableTimeSlots,
        max_intensity: newSettings.maxIntensity,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('training_settings')
        .upsert(settingsToSave, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error saving training settings:', error);
        toast({
          title: "Erreur de sauvegarde",
          description: "Impossible de sauvegarder vos paramètres",
          variant: "destructive"
        });
        return false;
      }

      setSettings(newSettings);
      toast({
        title: "Paramètres sauvegardés",
        description: "Vos préférences d'entraînement ont été sauvegardées avec succès",
      });
      return true;
    } catch (error) {
      console.error('Error saving training settings:', error);
      toast({
        title: "Erreur de sauvegarde",
        description: "Une erreur est survenue lors de la sauvegarde",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    settings,
    saveSettings,
    isLoading
  };
};
