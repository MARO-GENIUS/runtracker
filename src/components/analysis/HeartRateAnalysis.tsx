
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart } from 'lucide-react';

interface HeartRateAnalysisProps {
  primaryZone?: string;
  averageHeartRate?: number;
  maxHeartRate?: number;
  heartRateVariability?: string;
}

const HeartRateAnalysis = ({ 
  primaryZone, 
  averageHeartRate, 
  maxHeartRate, 
  heartRateVariability 
}: HeartRateAnalysisProps) => {
  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'Récupération': return 'bg-green-100 text-green-800';
      case 'Aérobie légère': return 'bg-blue-100 text-blue-800';
      case 'Aérobie': return 'bg-yellow-100 text-yellow-800';
      case 'Seuil': return 'bg-orange-100 text-orange-800';
      case 'Anaérobie': return 'bg-red-100 text-red-800';
      case 'Neuromusculaire': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Analyse de l'effort
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {primaryZone && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Zone d'effort principale</span>
            <Badge className={getZoneColor(primaryZone)}>
              {primaryZone}
            </Badge>
          </div>
        )}

        {averageHeartRate && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">FC moyenne</span>
            <span className="font-medium">{Math.round(averageHeartRate)} bpm</span>
          </div>
        )}

        {maxHeartRate && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">FC maximale</span>
            <span className="font-medium">{Math.round(maxHeartRate)} bpm</span>
          </div>
        )}

        {heartRateVariability && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Variabilité FC</span>
            <span className="font-medium">{heartRateVariability} bpm</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HeartRateAnalysis;
