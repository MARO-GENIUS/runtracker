
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePersonalRecords } from '@/hooks/usePersonalRecords';

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

  const { records: personalRecords, loading: recordsLoading } = usePersonalRecords();

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

  const formatPersonalRecords = (): string => {
    if (!personalRecords || personalRecords.length === 0) {
      return 'Aucun record personnel disponible pour le moment.';
    }

    // Map distance meters to standard formats
    const distanceMap: { [key: number]: string } = {
      5000: '5 km',
      10000: '10 km',
      21097: 'Semi-marathon',
      42195: 'Marathon'
    };

    const recordsText = personalRecords
      .filter(record => distanceMap[record.distanceMeters])
      .map(record => {
        const distanceName = distanceMap[record.distanceMeters];
        return `- ${distanceName} : ${record.time} réalisé le ${record.date}`;
      })
      .join('\n');

    return recordsText || 'Aucun record personnel sur les distances standards (5km, 10km, semi-marathon, marathon).';
  };

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

  const generateWorkout = async (stravaData: any) => {
    // Wait for personal records to load if they're still loading
    if (recordsLoading) {
      toast.error('Chargement des records en cours...');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Génération de séance avec les données:', stravaData);
      
      const systemMessage = "Tu es un coach sportif expert en course à pied. Tu analyses les données d'entraînement d'un coureur sur les 30 derniers jours, ainsi que ses records personnels, afin de lui proposer un plan d'entraînement optimisé pour atteindre son objectif. Ta réponse doit être claire, bien structurée, exploitable par une application, et adaptée aux séances passées, à la fatigue récente et aux capacités maximales du coureur.";
      
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

Voici également mes records personnels sur différentes distances :
${formatPersonalRecords()}

Objectif à venir : ${stravaData.currentGoal ? 
  `${stravaData.currentGoal.distance} en ${stravaData.currentGoal.target_time} le ${new Date(stravaData.currentGoal.target_date).toLocaleDateString('fr-FR')}` : 
  'Aucun objectif défini pour le moment'}

Génère la prochaine séance d'entraînement, adaptée à mon historique, ma fatigue, mon niveau et mes records. La réponse doit contenir :
- Type de séance (ex : seuil, récupération, intervalle…)
- Structure précise (ex : 6×400m à 4:30/km, récupération 1min)
- Allure cible
- Fréquence cardiaque cible
- Nombre de kilomètres totaux
- Durée estimée
- Justification de la séance : pourquoi ce type de séance maintenant ?
- Cohérence avec mes séances précédentes (ex : pas deux séances intenses consécutives)
- Adéquation avec mes records : ajuster les allures proposées en fonction de mes performances maximales

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
Merci de t'adapter au niveau et à la fatigue du coureur selon les données fournies et ses records personnels.`;

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
    loading: loading || recordsLoading,
    error,
    generateWorkout,
    markAsCompleted,
    generateNewWorkout,
    lastGeneratedSessions
  };
};
