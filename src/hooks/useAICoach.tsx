
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

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
}

export const useAICoach = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRecommendations = async () => {
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
      console.log('Calling AI coach analysis...');
      
      const { data, error: functionError } = await supabase.functions.invoke('ai-coach-analysis');

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
        
        toast({
          title: "Analyse IA terminée",
          description: `${data.recommendations.length} recommandations générées sur la base de ${data.analysisData?.totalActivities || 0} activités`,
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

  return {
    recommendations,
    analysisData,
    isLoading,
    error,
    generateRecommendations
  };
};
