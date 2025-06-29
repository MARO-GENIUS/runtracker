
import { useState, useEffect } from 'react';
import { useStravaData } from './useStravaData';
import { useTrainingSettingsPersistence } from './useTrainingSettingsPersistence';

interface TrainingSettings {
  targetRace: 'recuperation' | '5k' | '10k' | 'semi' | 'marathon';
  targetDate?: Date;
  weeklyFrequency: number;
  preferredDays: string[];
  availableTimeSlots: string[];
  maxIntensity: 'low' | 'medium' | 'high';
}

interface TrainingRecommendation {
  type: 'endurance' | 'tempo' | 'intervals' | 'recovery' | 'long';
  title: string;
  description: string;
  duration: number; // en minutes
  intensity: string;
  targetHR?: { min: number; max: number };
  scheduledFor: 'today' | 'tomorrow' | 'this-week';
  priority: 'high' | 'medium' | 'low';
}

export const useTrainingRecommendations = () => {
  const { stats } = useStravaData();
  const { settings, saveSettings, isLoading: settingsLoading } = useTrainingSettingsPersistence();
  const [recommendations, setRecommendations] = useState<TrainingRecommendation[]>([]);

  const generateRecommendations = () => {
    if (!stats) return;

    const avgHR = 167; // FC moyenne observée
    const avgDistance = stats.monthly.activitiesCount > 0 ? 
      stats.monthly.distance / stats.monthly.activitiesCount : 7.7; // km par sortie

    // Calcul des zones de FC
    const zones = {
      recovery: { min: Math.round(avgHR * 0.6), max: Math.round(avgHR * 0.7) },
      endurance: { min: Math.round(avgHR * 0.7), max: Math.round(avgHR * 0.8) },
      tempo: { min: Math.round(avgHR * 0.8), max: Math.round(avgHR * 0.9) },
      threshold: { min: Math.round(avgHR * 0.9), max: Math.round(avgHR * 0.95) }
    };

    const newRecommendations: TrainingRecommendation[] = [];

    // Estimation du nombre de jours depuis la dernière sortie basée sur l'activité mensuelle
    const daysSinceLastRun = stats.latest ? 
      Math.floor((new Date().getTime() - new Date(stats.latest.date).getTime()) / (1000 * 60 * 60 * 24)) : 2;

    if (daysSinceLastRun <= 1) {
      // Repos ou récupération active
      newRecommendations.push({
        type: 'recovery',
        title: 'Récupération active recommandée',
        description: 'Sortie très facile ou repos complet pour optimiser la récupération',
        duration: 30,
        intensity: 'Très facile',
        targetHR: zones.recovery,
        scheduledFor: 'today',
        priority: 'high'
      });
    } else if (daysSinceLastRun >= 2) {
      // Séance d'endurance
      newRecommendations.push({
        type: 'endurance',
        title: 'Sortie endurance fondamentale',
        description: 'Développement de la capacité aérobie, allure conversationnelle',
        duration: Math.min(60, Math.round(avgDistance * 8)), // Basé sur la distance moyenne
        intensity: 'Modérée',
        targetHR: zones.endurance,
        scheduledFor: daysSinceLastRun >= 3 ? 'today' : 'tomorrow',
        priority: 'high'
      });
    }

    // Recommandation de travail spécifique selon l'objectif
    if (settings.targetRace === '5k' || settings.targetRace === '10k') {
      newRecommendations.push({
        type: 'tempo',
        title: 'Séance au seuil',
        description: 'Amélioration de la vitesse seuil pour les distances courtes',
        duration: 45,
        intensity: 'Soutenue',
        targetHR: zones.tempo,
        scheduledFor: 'this-week',
        priority: 'medium'
      });
    }

    // Sortie longue pour les objectifs plus longs
    if (settings.targetRace === 'semi' || settings.targetRace === 'marathon') {
      newRecommendations.push({
        type: 'long',
        title: 'Sortie longue',
        description: 'Développement de l\'endurance pour les longues distances',
        duration: Math.min(120, Math.round(avgDistance * 12)),
        intensity: 'Facile à modérée',
        targetHR: zones.endurance,
        scheduledFor: 'this-week',
        priority: 'medium'
      });
    }

    setRecommendations(newRecommendations);
  };

  useEffect(() => {
    if (!settingsLoading) {
      generateRecommendations();
    }
  }, [stats, settings, settingsLoading]);

  return {
    recommendations,
    settings,
    updateSettings: saveSettings,
    refreshRecommendations: generateRecommendations,
    isLoadingSettings: settingsLoading
  };
};
