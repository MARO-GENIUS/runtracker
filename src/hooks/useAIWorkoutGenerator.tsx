import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePersonalRecords } from '@/hooks/usePersonalRecords';
import { calculateTrainingZones, formatTrainingZonesForAI } from '@/utils/trainingZones';

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

    // Map distance meters to standard formats avec tous les records importants
    const distanceMap: { [key: number]: string } = {
      400: '400m',
      800: '800m', 
      1000: '1000m',
      1609: '1 mile',
      3000: '3000m',
      5000: '5 km',
      10000: '10 km',
      15000: '15 km',
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

    return recordsText || 'Aucun record personnel sur les distances standards.';
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
      
      // Calculer les zones d'entraînement personnalisées
      const trainingZones = calculateTrainingZones(personalRecords);
      const zonesText = trainingZones ? formatTrainingZonesForAI(trainingZones) : '';
      
      console.log('Zones d\'entraînement calculées:', trainingZones);
      
      const systemMessage = `Tu es un coach sportif expert en course à pied avec une expertise particulière dans la personnalisation des allures d'entraînement. 

Tu analyses les données d'entraînement d'un coureur sur les 30 derniers jours, ainsi que ses records personnels, afin de lui proposer un plan d'entraînement optimisé pour atteindre son objectif.

RÈGLES CRITIQUES POUR LES ALLURES :
1. Tu DOIS utiliser les zones d'intensité calculées à partir des records personnels du coureur
2. Les allures proposées doivent être PRÉCISES et adaptées au niveau réel du coureur
3. RESPECTE STRICTEMENT les zones selon le type de séance :
   - VMA/Intervalle : utilise la zone VMA fournie
   - Seuil : utilise la zone SEUIL fournie  
   - Tempo : utilise la zone TEMPO fournie
   - Endurance/Récupération : utilise la zone ENDURANCE fournie

4. Ne propose JAMAIS d'allures génériques ou approximatives
5. Justifie toujours tes choix d'allure en référence aux zones calculées

Ta réponse doit être claire, bien structurée, exploitable par une application, et adaptée aux séances passées, à la fatigue récente et aux capacités maximales du coureur.`;
      
      const userMessage = `Voici mes données d'entraînement des 30 derniers jours :

RECORDS PERSONNELS :
${formatPersonalRecords()}

${zonesText}

HISTORIQUE D'ENTRAÎNEMENT (30 derniers jours) :
${formatTrainingData(stravaData)}

Objectif à venir : ${stravaData.currentGoal ? 
  `${stravaData.currentGoal.distance} en ${stravaData.currentGoal.target_time} le ${new Date(stravaData.currentGoal.target_date).toLocaleDateString('fr-FR')}` : 
  'Aucun objectif défini pour le moment'}

CONSIGNES IMPORTANTES :
- Utilise OBLIGATOIREMENT les zones d'intensité calculées ci-dessus
- Les allures doivent correspondre EXACTEMENT au type de séance demandé
- Pour une séance seuil, utilise la zone SEUIL (pas plus lent !)
- Pour du VMA, utilise la zone VMA
- Adapte selon ma fatigue et mes séances récentes
- Justifie tes choix d'allure en référence à mes zones personnalisées

Format de sortie requis :
{
  "séance": {
    "type": "Type de séance",
    "structure": "Structure détaillée de la séance",
    "allure_cible": "Allure basée sur mes zones personnalisées",
    "fc_cible": "Zone de FC adaptée",
    "kilométrage_total": "Distance totale",
    "durée_estimée": "Durée estimée",
    "justification": "Justification incluant pourquoi cette allure correspond à ma zone d'intensité"
  }
}`;

      console.log('Messages créés avec zones personnalisées, appel de la fonction Edge...');
      
      const { data, error: functionError } = await supabase.functions.invoke('generate-ai-workout', {
        body: { 
          systemMessage,
          userMessage,
          trainingData: formatTrainingData(stravaData)
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
