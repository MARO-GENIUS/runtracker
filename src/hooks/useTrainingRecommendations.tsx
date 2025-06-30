
import { useState, useEffect } from 'react';
import { useStravaData } from './useStravaData';
import { useTrainingSettingsPersistence } from './useTrainingSettingsPersistence';

interface TrainingSettings {
  targetRace: 'recuperation' | '5k' | '10k' | 'semi' | 'marathon';
  targetDate?: Date;
  targetTimeMinutes?: number;
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

    // Analyser la proximité de l'objectif personnel
    let weeksUntilRace = null;
    let isCloseToRace = false;
    if (settings.targetDate && settings.targetRace !== 'recuperation') {
      const raceDate = new Date(settings.targetDate);
      const daysUntilRace = Math.floor((raceDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      weeksUntilRace = Math.floor(daysUntilRace / 7);
      isCloseToRace = weeksUntilRace <= 8 && weeksUntilRace > 0;
    }

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
      // Séance d'endurance adaptée à l'objectif
      const enduranceTitle = isCloseToRace ? 
        `Endurance spécifique (objectif dans ${weeksUntilRace} sem.)` : 
        'Sortie endurance fondamentale';
      
      newRecommendations.push({
        type: 'endurance',
        title: enduranceTitle,
        description: isCloseToRace ? 
          'Développement de l\'endurance spécifique à votre objectif' : 
          'Développement de la capacité aérobie, allure conversationnelle',
        duration: Math.min(60, Math.round(avgDistance * 8)), // Basé sur la distance moyenne
        intensity: 'Modérée',
        targetHR: zones.endurance,
        scheduledFor: daysSinceLastRun >= 3 ? 'today' : 'tomorrow',
        priority: 'high'
      });
    }

    // Recommandation de travail spécifique selon l'objectif et la proximité
    if (settings.targetRace === '5k' || settings.targetRace === '10k') {
      const intensityTitle = isCloseToRace ? 
        `Séance spécifique ${settings.targetRace.toUpperCase()}` : 
        'Séance au seuil';
      
      newRecommendations.push({
        type: isCloseToRace ? 'intervals' : 'tempo',
        title: intensityTitle,
        description: isCloseToRace ? 
          'Travail spécifique à l\'allure de course' : 
          'Amélioration de la vitesse seuil pour les distances courtes',
        duration: 45,
        intensity: isCloseToRace ? 'Élevée - spécifique' : 'Soutenue',
        targetHR: isCloseToRace ? zones.threshold : zones.tempo,
        scheduledFor: 'this-week',
        priority: isCloseToRace ? 'high' : 'medium'
      });
    }

    // Sortie longue pour les objectifs plus longs
    if (settings.targetRace === 'semi' || settings.targetRace === 'marathon') {
      const longTitle = isCloseToRace ? 
        `Sortie longue spécifique (${settings.targetRace})` : 
        'Sortie longue';
      
      newRecommendations.push({
        type: 'long',
        title: longTitle,
        description: isCloseToRace ? 
          'Sortie longue avec passages à l\'allure objectif' : 
          'Développement de l\'endurance pour les longues distances',
        duration: Math.min(120, Math.round(avgDistance * 12)),
        intensity: isCloseToRace ? 'Modérée avec intensité ciblée' : 'Facile à modérée',
        targetHR: zones.endurance,
        scheduledFor: 'this-week',
        priority: isCloseToRace ? 'high' : 'medium'
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
