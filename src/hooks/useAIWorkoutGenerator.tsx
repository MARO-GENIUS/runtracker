
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GeneratedWorkout {
  type: string;
  structure: string;
  allure_cible: string;
  fc_cible: string;
  kilométrage_total: string;
  durée_estimée: string;
  justification: string;
}

interface UseAIWorkoutGeneratorReturn {
  workout: GeneratedWorkout | null;
  loading: boolean;
  error: string | null;
  generateWorkout: (stravaData: any) => Promise<void>;
  markAsCompleted: () => void;
  generateNewWorkout: (stravaData: any) => Promise<void>;
  lastGeneratedSessions: string[];
}

export const useAIWorkoutGenerator = (): UseAIWorkoutGeneratorReturn => {
  const [workout, setWorkout] = useState<GeneratedWorkout | null>(() => {
    // Load workout from localStorage on initialization
    const savedWorkout = localStorage.getItem('ai-generated-workout');
    return savedWorkout ? JSON.parse(savedWorkout) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGeneratedSessions, setLastGeneratedSessions] = useState<string[]>(() => {
    const saved = localStorage.getItem('ai-last-sessions');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist workout to localStorage whenever it changes
  useEffect(() => {
    if (workout) {
      localStorage.setItem('ai-generated-workout', JSON.stringify(workout));
    } else {
      localStorage.removeItem('ai-generated-workout');
    }
  }, [workout]);

  // Persist last sessions to localStorage
  useEffect(() => {
    localStorage.setItem('ai-last-sessions', JSON.stringify(lastGeneratedSessions));
  }, [lastGeneratedSessions]);

  const formatTrainingData = (stravaData: any): string => {
    return stravaData.activities.map((activity: any) => {
      const date = new Date(activity.date).toLocaleDateString('fr-FR');
      const sessionType = activity.effort_type || 'Non défini';
      const duration = Math.round(activity.duration_minutes);
      const distance = activity.distance_km.toFixed(1);
      const pace = activity.average_pace_min_per_km;
      const avgHr = activity.average_heart_rate || 'N/A';
      const maxHr = activity.max_heart_rate || 'N/A';
      const rpe = activity.rpe || 'N/A';
      
      return `Date: ${date}
Type de séance: ${sessionType}
Durée: ${duration} minutes
Distance: ${distance} km
Allure moyenne: ${pace}/km
Allures par segment: ${pace}/km (donnée simplifiée)
Fréquence cardiaque moyenne: ${avgHr} bpm
Fréquence cardiaque maximale: ${maxHr} bpm
RPE: ${rpe}
Objectif associé: ${stravaData.currentGoal ? 
  `${stravaData.currentGoal.distance} en ${stravaData.currentGoal.target_time} le ${new Date(stravaData.currentGoal.target_date).toLocaleDateString('fr-FR')}` : 
  'Aucun objectif défini'}`;
    }).join('\n\n');
  };

  const calculatePaceZones = (records: any): string => {
    if (!records['5K'] && !records['10K']) return 'Zones d\'allure non calculables (manque de records)';
    
    // Utiliser le 5K ou 10K pour estimer la VMA
    let vmaBase = '4:30'; // Valeur par défaut
    
    if (records['5K']) {
      const [min, sec] = records['5K'].split(':').map(Number);
      const totalSeconds = min * 60 + sec;
      const pace5k = totalSeconds / 5; // pace en secondes par km
      vmaBase = `${Math.floor(pace5k / 60)}:${String(Math.round(pace5k % 60)).padStart(2, '0')}`;
    } else if (records['10K']) {
      const [min, sec] = records['10K'].split(':').map(Number);
      const totalSeconds = min * 60 + sec;
      const pace10k = totalSeconds / 10;
      const vmaSeconds = pace10k * 0.95; // Estimation VMA = 95% du 10K
      vmaBase = `${Math.floor(vmaSeconds / 60)}:${String(Math.round(vmaSeconds % 60)).padStart(2, '0')}`;
    }

    return `VMA (100%) : ${vmaBase}/km | Seuil (90%) : calculé automatiquement | Endurance (75-80%) : calculé automatiquement`;
  };

  const generateWorkout = async (stravaData: any) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Génération de séance avec les données:', stravaData);
      
      const systemMessage = "Tu es un coach sportif expert en course à pied. Tu analyses les données d'entraînement d'un coureur sur les 30 derniers jours afin de lui proposer un plan d'entraînement optimisé pour atteindre son objectif à venir. Ta réponse doit être claire, bien structurée, exploitable par une application, et adaptée au contenu des séances passées.";
      
      const userMessage = `Voici mes données d'entraînement des 30 derniers jours, incluant pour chaque séance :
- Date
- Type de séance (ex : récupération, intervalle, tempo…)
- Durée (en minutes)
- Distance (en km)
- Allure moyenne (en min/km)
- Allures par segment (en min/km)
- Fréquence cardiaque moyenne et maximale (en bpm)
- RPE (échelle de 1 à 10)
- Objectif associé (si applicable) : [distance], [temps visé], [date]

Objectif à venir : ${stravaData.currentGoal ? 
  `${stravaData.currentGoal.distance} en ${stravaData.currentGoal.target_time} le ${new Date(stravaData.currentGoal.target_date).toLocaleDateString('fr-FR')}` : 
  'Aucun objectif défini pour le moment'}

Génère la prochaine séance d'entraînement, adaptée à mon historique. La réponse doit contenir :
- Type de séance (ex : seuil, récupération, intervalle…)
- Structure précise (ex : 6×400m à 4:30/km, récupération 1min)
- Allure cible
- Fréquence cardiaque cible
- Nombre de kilomètres totaux
- Durée estimée
- Justification de la séance : pourquoi ce type de séance maintenant ?
- Cohérence avec mes séances précédentes (pas deux séances dures à la suite, etc.)

Format de sortie requis :
{
  "séance": {
    "type": "Intervalle",
    "structure": "6×400m à 4:30/km, récup 1min",
    "allure_cible": "4:30/km",
    "fc_cible": "150-165 bpm",
    "kilométrage_total": "7 km",
    "durée_estimée": "40 min",
    "justification": "Travail de VMA après deux jours de récupération active."
  }
}
Merci de t'adapter au niveau et à la fatigue du coureur selon les données fournies.`;

      const trainingData = formatTrainingData(stravaData);
      
      console.log('Messages créés, appel de la fonction Edge...');
      
      const { data, error: functionError } = await supabase.functions.invoke('generate-ai-workout', {
        body: { 
          systemMessage,
          userMessage,
          trainingData
        }
      });

      console.log('Réponse de la fonction Edge:', data, functionError);

      if (functionError) {
        console.error('Erreur de la fonction Edge:', functionError);
        throw new Error(functionError.message || 'Erreur lors de la génération de la séance');
      }

      if (data?.error || !data?.success) {
        console.error('Erreur dans la réponse:', data?.error);
        throw new Error(data?.error || 'Erreur lors de la génération de la séance');
      }

      if (data?.workout) {
        console.log('Séance générée avec succès:', data.workout);
        setWorkout(data.workout);
        
        // Ajouter le type de séance à l'historique (max 3 dernières)
        setLastGeneratedSessions(prev => {
          const newHistory = [data.workout.type, ...prev].slice(0, 3);
          return newHistory;
        });
        
        toast.success('Séance générée avec succès !');
      } else {
        console.error('Pas de séance dans la réponse:', data);
        throw new Error('Réponse invalide de l\'IA');
      }

    } catch (error: any) {
      console.error('Erreur lors de la génération:', error);
      const errorMessage = error.message || 'Erreur lors de la génération de la séance';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = () => {
    if (workout) {
      toast.success(`Séance "${workout.type}" marquée comme effectuée !`);
      // Explicitly clear the workout state only when user clicks "Mark as completed"
      setWorkout(null);
      setError(null);
    }
  };

  const generateNewWorkout = async (stravaData: any) => {
    // Explicitly clear the current workout and generate a new one only when user clicks "Generate new workout"
    setWorkout(null);
    setError(null);
    await generateWorkout(stravaData);
  };

  return {
    workout,
    loading,
    error,
    generateWorkout,
    markAsCompleted,
    generateNewWorkout,
    lastGeneratedSessions
  };
};
