
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';

interface ImprovementTipsProps {
  paceConsistency?: string;
  avgCadence?: number;
  hasCadenceData?: boolean;
  primaryZone?: string;
}

const ImprovementTips = ({ 
  paceConsistency, 
  avgCadence, 
  hasCadenceData, 
  primaryZone 
}: ImprovementTipsProps) => {
  const getPaceConsistencyScore = (consistency?: string) => {
    if (!consistency) return 0;
    return parseFloat(consistency) * 100;
  };

  const consistencyScore = getPaceConsistencyScore(paceConsistency);

  const tips = [];

  if (consistencyScore < 60) {
    tips.push('• Travaillez la régularité d\'allure avec des séances au tempo');
  }

  if (hasCadenceData && avgCadence && avgCadence < 170) {
    tips.push('• Augmentez votre cadence pour améliorer l\'efficacité (objectif: 170-180 pas/min)');
  }

  if (primaryZone === 'Anaérobie') {
    tips.push('• Intégrez plus de séances en zones 1-2 pour développer l\'endurance');
  }

  if (!hasCadenceData) {
    tips.push('• Utilisez un capteur de cadence pour des analyses plus précises');
  }

  if (tips.length === 0) return null;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Zap className="h-5 w-5" />
          Conseils d'amélioration
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-blue-700 space-y-2">
        {tips.map((tip, index) => (
          <p key={index}>{tip}</p>
        ))}
      </CardContent>
    </Card>
  );
};

export default ImprovementTips;
