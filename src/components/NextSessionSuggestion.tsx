
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Loader2 } from 'lucide-react';
import { useNextSessionAnalysis } from '@/hooks/useNextSessionAnalysis';

interface NextSessionSuggestionProps {
  activityId: number;
}

export const NextSessionSuggestion: React.FC<NextSessionSuggestionProps> = ({ activityId }) => {
  const { analysis, loading, error, analyzeNextSession } = useNextSessionAnalysis();

  const handleAnalyze = () => {
    analyzeNextSession(activityId);
  };

  const parseSuggestion = (suggestion: string) => {
    const lines = suggestion.split('\n').filter(line => line.trim());
    const parsed = {
      type: '',
      duration: '',
      pace: '',
      recovery: ''
    };

    lines.forEach(line => {
      const cleanLine = line.replace(/\*\*/g, '').trim();
      if (cleanLine.toLowerCase().includes('type :')) {
        parsed.type = cleanLine.split(':')[1]?.trim() || '';
      } else if (cleanLine.toLowerCase().includes('durée :')) {
        parsed.duration = cleanLine.split(':')[1]?.trim() || '';
      } else if (cleanLine.toLowerCase().includes('allure :')) {
        parsed.pace = cleanLine.split(':')[1]?.trim() || '';
      } else if (cleanLine.toLowerCase().includes('récupération :')) {
        parsed.recovery = cleanLine.split(':')[1]?.trim() || '';
      }
    });

    return parsed;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          Suggestion IA - Prochaine séance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysis && !loading && (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">
              Obtenez une suggestion personnalisée pour votre prochaine séance d'entraînement
            </p>
            <Button onClick={handleAnalyze} className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Analyser ma prochaine séance
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Analyse de vos données en cours...</p>
            <p className="text-sm text-gray-500 mt-2">
              L'IA analyse vos 20 dernières activités pour vous proposer la séance optimale
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <Button 
              onClick={handleAnalyze} 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              Réessayer
            </Button>
          </div>
        )}

        {analysis && analysis.activityId === activityId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-4">Recommandation personnalisée :</h3>
            
            {(() => {
              const suggestion = parseSuggestion(analysis.suggestion);
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestion.type && (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-blue-800">Type</span>
                      <span className="text-gray-900">{suggestion.type}</span>
                    </div>
                  )}
                  {suggestion.duration && (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-blue-800">Durée</span>
                      <span className="text-gray-900">{suggestion.duration}</span>
                    </div>
                  )}
                  {suggestion.pace && (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-blue-800">Allure</span>
                      <span className="text-gray-900">{suggestion.pace}</span>
                    </div>
                  )}
                  {suggestion.recovery && (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-blue-800">Récupération</span>
                      <span className="text-gray-900">{suggestion.recovery}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Fallback si le parsing échoue */}
            {!parseSuggestion(analysis.suggestion).type && (
              <div className="whitespace-pre-wrap text-gray-900">
                {analysis.suggestion}
              </div>
            )}

            <Button 
              onClick={handleAnalyze} 
              variant="outline" 
              size="sm" 
              className="mt-4"
            >
              Nouvelle analyse
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
