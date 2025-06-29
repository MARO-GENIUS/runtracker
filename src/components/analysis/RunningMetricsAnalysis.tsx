
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface RunningMetricsAnalysisProps {
  avgCadence?: number;
  hasCadenceData?: boolean;
  avgElevationGainPerKm?: string;
  distance?: number;
  movingTime?: number;
}

const RunningMetricsAnalysis = ({ 
  avgCadence, 
  hasCadenceData, 
  avgElevationGainPerKm,
  distance,
  movingTime 
}: RunningMetricsAnalysisProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-500" />
          Métriques de course
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasCadenceData && avgCadence && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Cadence moyenne</span>
            <span className="font-medium">{avgCadence} pas/min</span>
          </div>
        )}

        {avgElevationGainPerKm && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Dénivelé moyen/km</span>
            <span className="font-medium">{avgElevationGainPerKm} m</span>
          </div>
        )}

        {distance && movingTime && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Vitesse moyenne</span>
            <span className="font-medium">
              {((distance / 1000) / (movingTime / 3600)).toFixed(1)} km/h
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RunningMetricsAnalysis;
