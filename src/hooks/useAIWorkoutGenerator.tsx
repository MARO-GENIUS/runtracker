
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WorkoutBlock {
  description: string;
  distance_m: number | null;
  duree_minutes: number | null;
  allure_min_per_km: string;
  frequence_cardiaque_cible: number | null;
  puissance_cible: number | null;
  rpe: number;
  recuperation: string;
}

interface GeneratedWorkout {
  nom_seance: string;
  objectif: string;
  type: string;
  blocs: WorkoutBlock[];
  variante_facile: string;
  variante_difficile: string;
  explication: string;
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

  const createPrompt = (stravaData: any): string => {
    // Analyser la répartition des types d'effort sur les 30 derniers jours
    const effortDistribution = stravaData.activities.reduce((acc: any, activity: any) => {
      acc[activity.effort_type] = (acc[activity.effort_type] || 0) + 1;
      return acc;
    }, {});

    // Calculer la charge d'entraînement hebdomadaire
    const totalDistance = stravaData.activities.reduce((sum: number, activity: any) => sum + activity.distance_km, 0);
    const weeklyAverage = Math.round(totalDistance / 4.3); // Moyenne sur ~4.3 semaines

    // Calculer les zones d'allure basées sur les records
    const paceZones = calculatePaceZones(stravaData.personalRecords);

    const activitiesText = stravaData.activities
      .slice(0, 15) // Prendre les 15 dernières activités pour plus de détail
      .map((activity: any) => 
        `${activity.date}: ${activity.distance_km}km en ${activity.duration_minutes}min (${activity.average_pace_min_per_km}/km, FC: ${activity.average_heart_rate || 'N/A'}, Type: ${activity.effort_type}, RPE: ${activity.rpe || 'N/A'})`
      ).join('\n');

    const recordsText = Object.entries(stravaData.personalRecords)
      .filter(([_, time]) => time !== null)
      .map(([distance, time]) => `${distance}: ${time}`)
      .join(', ');

    const effortAnalysis = Object.entries(effortDistribution)
      .map(([type, count]) => `${type}: ${count} séances`)
      .join(', ');

    const lastSessionsHistory = lastGeneratedSessions.length > 0 
      ? `\nSÉANCES RÉCEMMENT GÉNÉRÉES (à éviter) : ${lastGeneratedSessions.join(', ')}`
      : '';

    return `Tu es un coach expert en course à pied spécialisé en périodisation. Analyse mes données et propose une séance adaptée et DIFFÉRENTE de mes habitudes récentes.

📊 **ANALYSE DE MON ENTRAÎNEMENT (30 derniers jours)** :
- Volume hebdomadaire moyen : ${weeklyAverage}km
- Répartition des types d'effort : ${effortAnalysis}
- Nombre total de séances : ${stravaData.activities.length}

🏃‍♂️ **MES 15 DERNIÈRES ACTIVITÉS** :
${activitiesText}

⏱️ **MES RECORDS PERSONNELS** : ${recordsText || 'Aucun record enregistré'}

🎯 **MON OBJECTIF** : ${stravaData.currentGoal ? `${stravaData.currentGoal.distance} en ${stravaData.currentGoal.target_time} pour le ${stravaData.currentGoal.target_date}` : 'Aucun objectif défini'}

⚡ **ZONES D'ALLURE CALCULÉES** (basées sur mes records) :
${paceZones}

🔄 **TYPE DE MA DERNIÈRE SÉANCE** : ${stravaData.lastSessionType || 'Aucune séance récente'}${lastSessionsHistory}

**RÈGLES DE PÉRIODISATION À RESPECTER** :
1. Si j'ai fait beaucoup de séances d'endurance récemment → propose de la qualité (seuil/VMA)
2. Si j'ai fait du travail intense récemment → propose de la récupération ou de l'endurance
3. Si manque de variété → introduis un type de séance rare dans mes données
4. ÉVITE absolument les types de séances récemment générées (voir historique ci-dessus)
5. Adapte l'intensité à ma forme récente et mes objectifs

**TYPES DE SÉANCES DISPONIBLES** :
- Recovery run (allure très facile)
- Easy run (endurance fondamentale)  
- Long run (sortie longue)
- Tempo run (allure seuil)
- Threshold (seuil lactique)
- Intervals VMA (répétitions courtes)
- Intervals longues (1000m-2000m)
- Hill repeats (côtes)
- Fartlek (jeu d'allure)

**FORMAT DE RÉPONSE** - JSON strict uniquement :

{
  "nom_seance": "",
  "objectif": "",
  "type": "recovery / easy run / long run / tempo / threshold / intervals VMA / intervals longues / hills / fartlek",
  "blocs": [
    {
      "description": "400m à 3:50/km",
      "distance_m": 400,
      "duree_minutes": null,
      "allure_min_per_km": "3:50",
      "frequence_cardiaque_cible": 168,
      "puissance_cible": null,
      "rpe": 7,
      "recuperation": "1'30 marche ou footing léger"
    }
  ],
  "variante_facile": "",
  "variante_difficile": "",
  "explication": "Analyse de l'intérêt de cette séance par rapport à mon historique et mes objectifs"
}`;
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
      
      const prompt = createPrompt(stravaData);
      console.log('Prompt créé, appel de la fonction Edge...');
      
      const { data, error: functionError } = await supabase.functions.invoke('generate-ai-workout', {
        body: { prompt }
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
      toast.success(`Séance "${workout.nom_seance}" marquée comme effectuée !`);
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
