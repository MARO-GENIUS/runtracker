
import { useState } from 'react';
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
}

export const useAIWorkoutGenerator = (): UseAIWorkoutGeneratorReturn => {
  const [workout, setWorkout] = useState<GeneratedWorkout | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPrompt = (stravaData: any): string => {
    const activitiesText = stravaData.activities.map((activity: any) => 
      `${activity.date}: ${activity.distance_km}km en ${activity.duration_minutes}min (${activity.average_pace_min_per_km}/km, FC: ${activity.average_heart_rate || 'N/A'}, Type: ${activity.effort_type}, RPE: ${activity.rpe || 'N/A'})`
    ).join('\n');

    const recordsText = Object.entries(stravaData.personalRecords)
      .filter(([_, time]) => time !== null)
      .map(([distance, time]) => `${distance}: ${time}`)
      .join(', ');

    return `Tu es un coach expert en course à pied. Je vais te fournir mes données des 30 derniers jours issues de Strava (distance, durée, fréquence cardiaque, puissance, RPE, etc.), mes records personnels (5K, 10K, semi, marathon), mon objectif à venir (ex : sub 45' au 10 km), et surtout le **type de ma dernière séance** (ex. : footing, intervalle, côtes…).

Ta mission est de me proposer une **nouvelle séance personnalisée**, prête à être exécutée, selon les consignes suivantes :

1. **Analyse mon état de forme**, mon historique récent, et ma charge d'entraînement.
2. **Prends en compte le type de mes dernières séances** pour diversifier les sollicitations.  
   Ex : si la dernière séance était une sortie longue, évite de proposer la même chose.
3. Propose une **séance différente, complémentaire et utile à mon objectif**, en choisissant parmi :
   - Easy run
   - Long run
   - Tempo run
   - Threshold
   - Intervals (courts ou longs)
   - Hill repeats
   - Fartlek
   - Recovery run
   - Taper session
4. **Adapte la structure du retour au type de séance** :
   - Si séance **tempo / intervalle / côtes** : donne chaque bloc avec distance/durée + allure + RPE + FC + récupération.  
     Ex : \`4 x 400m à 3:50/km, récup 1'30\` ou \`100m à 4:12/km – repos 1'\`
   - Si **endurance** : structure par paliers ou temps continus à intensité progressive
   - Si **fartlek** : mélange de blocs libres mais toujours précis (ex : 2 min rapide – 1 min lent x 6)
   - Pour chaque bloc : toujours indiquer **allure, RPE, FC cible, temps de récupération**
5. Ajoute :
   - Une **variante facile** (pour jour de fatigue)
   - Une **variante difficile** (pour jour de forme)
6. Termine par une **explication claire et pédagogique** de la logique d'entraînement
7. Adapte toutes les intensités (FC, allure, puissance) à mes **données récentes + records + objectif**

DONNÉES DE MES 30 DERNIERS JOURS :
${activitiesText}

MES RECORDS PERSONNELS : ${recordsText || 'Aucun record enregistré'}

MON OBJECTIF ACTUEL : ${stravaData.currentGoal ? `${stravaData.currentGoal.distance} en ${stravaData.currentGoal.target_time} pour le ${stravaData.currentGoal.target_date}` : 'Aucun objectif défini'}

TYPE DE MA DERNIÈRE SÉANCE : ${stravaData.lastSessionType || 'Aucune séance récente'}

Réponds strictement avec ce format JSON :

{
  "nom_seance": "",
  "objectif": "",
  "type": "easy run / tempo / interval / hills / long run / recovery / taper / autre",
  "blocs": [
    {
      "description": "400m à 3:50/km",
      "distance_m": 400,
      "duree_minutes": null,
      "allure_min_per_km": "3:50",
      "frequence_cardiaque_cible": 168,
      "puissance_cible": 385,
      "rpe": 7,
      "recuperation": "1'30 marche ou footing léger"
    }
  ],
  "variante_facile": "2 x 400m à 4:10/km au lieu de 4",
  "variante_difficile": "6 x 400m à 3:45/km avec 1' récup",
  "explication": "Cette séance développe la VO2max grâce à des répétitions proches de la VMA, tout en respectant une récupération suffisante. Elle s'intègre parfaitement après un footing léger ou une sortie longue."
}

Réponds uniquement avec ce JSON, sans ajout de texte libre. Objectif : que je puisse exécuter la séance immédiatement sans avoir à l'interpréter.`;
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
    generateNewWorkout
  };
};
