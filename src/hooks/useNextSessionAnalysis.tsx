
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface NextSessionAnalysisResult {
  suggestion: string;
  activityId: number;
}

interface UseNextSessionAnalysisReturn {
  analysis: NextSessionAnalysisResult | null;
  loading: boolean;
  error: string | null;
  analyzeNextSession: (activityId: number) => Promise<void>;
}

export const useNextSessionAnalysis = (): UseNextSessionAnalysisReturn => {
  const [analysis, setAnalysis] = useState<NextSessionAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const analyzeNextSession = async (activityId: number) => {
    if (!user) {
      setError('Utilisateur non connecté');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`Starting next session analysis for activity ${activityId}`);

      const { data, error: functionError } = await supabase.functions.invoke('analyze-next-session', {
        body: { activityId }
      });

      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error(functionError.message || 'Erreur lors de l\'analyse');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.success && data?.suggestion) {
        console.log('Analysis completed successfully');
        setAnalysis({
          suggestion: data.suggestion,
          activityId
        });
        toast.success('Analyse terminée !');
      } else {
        throw new Error('Réponse invalide de l\'API');
      }

    } catch (error: any) {
      console.error('Error analyzing next session:', error);
      const errorMessage = error.message || 'Erreur lors de l\'analyse de la prochaine séance';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    analysis,
    loading,
    error,
    analyzeNextSession
  };
};
