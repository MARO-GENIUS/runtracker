
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target } from 'lucide-react';

interface PaceConsistencyAnalysisProps {
  averageSpeed?: number;
  paceConsistency?: string;
}

const PaceConsistencyAnalysis = ({ averageSpeed, paceConsistency }: PaceConsistencyAnalysisProps) => {
  const formatPace = (speed?: number) => {
    if (!speed) return 'N/A';
    const pace = 1000 / (speed * 60); // minutes per km
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
  };

  const getPaceConsistencyScore = (consistency?: string) => {
    if (!consistency) return { score: 0, label: 'Inconnue' };
    const score = parseFloat(consistency) * 100;
    if (score >= 80) return { score, label: 'Excellente' };
    if (score >= 60) return { score, label: 'Bonne' };
    if (score >= 40) return { score, label: 'Moyenne' };
    return { score, label: 'À améliorer' };
  };

  const consistencyData = getPaceConsistencyScore(paceConsistency);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          Régularité d'allure
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Allure moyenne</span>
          <span className="font-medium">{formatPace(averageSpeed)}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Consistance</span>
            <span className="font-medium">{consistencyData.label}</span>
          </div>
          <Progress value={consistencyData.score} className="h-2" />
          <p className="text-xs text-gray-500">
            Score de régularité : {consistencyData.score.toFixed(1)}%
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaceConsistencyAnalysis;
