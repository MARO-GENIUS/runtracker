
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface TrainingZonesProps {
  effortZones?: {
    zone1: number;
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
  };
}

const TrainingZones = ({ effortZones }: TrainingZonesProps) => {
  if (!effortZones) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-500" />
          Zones d'entraînement
        </CardTitle>
        <CardDescription>
          Zones de fréquence cardiaque recommandées
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Zone 1 (Récupération)</span>
            <span>&lt; {effortZones.zone1} bpm</span>
          </div>
          <div className="flex justify-between">
            <span>Zone 2 (Aérobie légère)</span>
            <span>{effortZones.zone1} - {effortZones.zone2} bpm</span>
          </div>
          <div className="flex justify-between">
            <span>Zone 3 (Aérobie)</span>
            <span>{effortZones.zone2} - {effortZones.zone3} bpm</span>
          </div>
          <div className="flex justify-between">
            <span>Zone 4 (Seuil)</span>
            <span>{effortZones.zone3} - {effortZones.zone4} bpm</span>
          </div>
          <div className="flex justify-between">
            <span>Zone 5 (Anaérobie)</span>
            <span>&gt; {effortZones.zone4} bpm</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingZones;
