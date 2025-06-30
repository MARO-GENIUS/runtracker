
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Brain, AlertTriangle, CheckCircle } from 'lucide-react';

interface AnalysisData {
  totalActivities: number;
  averageDistance: string;
  lastActivity: string;
  fatigueScore?: string;
  workoutBalance?: string;
  recentTypes?: string[];
}

interface AdaptiveAnalysisDisplayProps {
  analysisData: AnalysisData | null;
  isVisible: boolean;
}

const AdaptiveAnalysisDisplay = ({ analysisData, isVisible }: AdaptiveAnalysisDisplayProps) => {
  if (!isVisible || !analysisData) return null;

  const getFatigueColor = (score: string) => {
    const numScore = parseFloat(score);
    if (numScore < 4) return 'bg-green-100 text-green-800';
    if (numScore > 7) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getBalanceIcon = (balance: string) => {
    if (balance.includes('trop')) return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    if (balance === 'équilibré') return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Activity className="h-4 w-4 text-blue-500" />;
  };

  const getWorkoutTypeColor = (type: string) => {
    switch (type) {
      case 'intervals': return 'bg-red-100 text-red-800';
      case 'tempo': return 'bg-orange-100 text-orange-800';
      case 'endurance': return 'bg-blue-100 text-blue-800';
      case 'recovery': return 'bg-green-100 text-green-800';
      case 'long': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrenchWorkoutType = (type: string) => {
    const translations = {
      'intervals': 'Fractionné',
      'tempo': 'Tempo',
      'endurance': 'Endurance',
      'recovery': 'Récupération',
      'long': 'Sortie longue'
    };
    return translations[type as keyof typeof translations] || type;
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          Analyse Adaptative IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Score de fatigue */}
          {analysisData.fatigueScore && (
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-2 rounded-lg ${getFatigueColor(analysisData.fatigueScore)}`}>
                <div className="text-2xl font-bold mr-2">{analysisData.fatigueScore}/10</div>
                <div className="text-sm">
                  {parseFloat(analysisData.fatigueScore) < 4 ? 'Forme' : 
                   parseFloat(analysisData.fatigueScore) > 7 ? 'Fatigue élevée' : 'Fatigue modérée'}
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">Score de fatigue</p>
            </div>
          )}

          {/* Équilibre des séances */}
          {analysisData.workoutBalance && (
            <div className="text-center">
              <div className="inline-flex items-center px-3 py-2 rounded-lg bg-gray-100">
                {getBalanceIcon(analysisData.workoutBalance)}
                <span className="ml-2 text-sm font-medium">{analysisData.workoutBalance}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Équilibre récent</p>
            </div>
          )}

          {/* Activités analysées */}
          <div className="text-center">
            <div className="inline-flex items-center px-3 py-2 rounded-lg bg-blue-100">
              <Activity className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium">{analysisData.totalActivities} courses</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Analysées</p>
          </div>
        </div>

        {/* Types de séances récentes */}
        {analysisData.recentTypes && analysisData.recentTypes.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Pattern des dernières séances :
            </p>
            <div className="flex flex-wrap gap-2">
              {analysisData.recentTypes.map((type, index) => (
                <Badge key={index} className={getWorkoutTypeColor(type)}>
                  {getFrenchWorkoutType(type)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t text-sm text-gray-600">
          <div>
            <span className="font-medium">Distance moyenne:</span> {analysisData.averageDistance}km
          </div>
          <div>
            <span className="font-medium">Dernière course:</span> {analysisData.lastActivity}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdaptiveAnalysisDisplay;
