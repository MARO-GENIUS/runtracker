
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { usePersistentAIRecommendations } from './usePersistentAIRecommendations';

export interface AIRecommendation {
  type: 'endurance' | 'tempo' | 'intervals' | 'recovery' | 'long';
  title: string;
  description: string;
  duration: number;
  intensity: string;
  targetPace?: string;
  targetHR?: { min: number; max: number };
  warmup: string;
  mainSet: string;
  cooldown: string;
  scheduledFor: 'today' | 'tomorrow' | 'this-week';
  priority: 'high' | 'medium' | 'low';
  aiJustification: string;
  nutritionTips?: string;
  recoveryAdvice?: string;
}

interface AnalysisData {
  totalActivities: number;
  averageDistance: string;
  lastActivity: string;
  fatigueScore?: string;
  workoutBalance?: string;
  recentTypes?: string[];
  daysSinceLastActivity?: number;
  daysUntilPlanned?: number;
  weeksUntilRace?: number;
  raceGoal?: string;
  targetPaces?: {
    easy: string;
    tempo: string;
    threshold: string;
    intervals: string;
  };
  periodization?: {
    phase: string;
    intensityFocus: string;
    volumeFocus: string;
  };
}

export const useAICoach = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  
  // Intégrer le hook de persistance
  const { saveRecommendations } = usePersistentAIRecommendations();

  const generateRecommendations = async (plannedDate?: Date) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour utiliser le coach IA",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Calling AI coach analysis with planned date:', plannedDate);
      
      const requestBody = plannedDate ? { plannedDate: plannedDate.toISOString() } : {};
      
      const { data, error: functionError } = await supabase.functions.invoke('ai-coach-analysis', {
        body: requestBody
      });

      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error(functionError.message || 'Erreur lors de l\'analyse IA');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.success && data.recommendations) {
        setRecommendations(data.recommendations);
        setAnalysisData(data.analysisData || null);
        
        // Sauvegarder la date planifiée si fournie
        if (plannedDate) {
          setScheduledDate(plannedDate);
        }
        
        // Sauvegarder les recommandations de façon persistante avec la date
        const recommendationsWithDate = data.recommendations.map((rec: AIRecommendation) => ({
          ...rec,
          scheduledDate: plannedDate?.toISOString()
        }));
        
        await saveRecommendations(recommendationsWithDate);
        
        toast({
          title: "Analyse IA terminée",
          description: `${data.recommendations.length} recommandations générées${plannedDate ? ' pour le ' + plannedDate.toLocaleDateString() : ''}`,
        });
      } else {
        throw new Error('Aucune recommandation générée');
      }

    } catch (error: any) {
      console.error('Error generating AI recommendations:', error);
      const errorMessage = error.message || 'Erreur lors de la génération des recommandations IA';
      setError(errorMessage);
      
      toast({
        title: "Erreur du coach IA",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateScheduledDate = (newDate: Date) => {
    setScheduledDate(newDate);
  };

  const reanalyzeWithNewDate = async () => {
    if (scheduledDate) {
      await generateRecommendations(scheduledDate);
    }
  };

  return {
    recommendations,
    analysisData,
    isLoading,
    error,
    scheduledDate,
    generateRecommendations,
    updateScheduledDate,
    reanalyzeWithNewDate
  };
};
