
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Activity, Heart, Zap, Target, TrendingUp, Timer } from 'lucide-react';

interface MetricsAnalysisProps {
  derivedMetrics: {
    avgElevationGainPerKm?: string;
    heartRateVariability?: string;
    effortZones?: {
      zone1: number;
      zone2: number;
      zone3: number;
      zone4: number;
      zone5: number;
    };
    primaryZone?: string;
    paceConsistency?: string;
    avgCadence?: number;
    hasCadenceData?: boolean;
  };
  activity?: {
    average_heartrate?: number;
    max_heartrate?: number;
    average_speed?: number;
    distance?: number;
    moving_time?: number;
  };
}

const MetricsAnalysis = ({ derivedMetrics, activity }: MetricsAnalysisProps) => {
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

  const getPaceConsistencyScore = (consistency?: string) => {
    if (!consistency) return { score: 0, label: 'Inconnue' };
    const score = parseFloat(consistency) * 100;
    if (score >= 80) return { score, label: 'Excellente' };
    if (score >= 60) return { score, label: 'Bonne' };
    if (score >= 40) return { score, label: 'Moyenne' };
    return { score, label: 'À améliorer' };
  };

  const formatPace = (speed?: number) => {
    if (!speed) return 'N/A';
    const pace = 1000 / (speed * 60); // minutes per km
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
  };

  const consistencyData = getPaceConsistencyScore(derivedMetrics.paceConsistency);

  return (
    <div className="space-y-6">
      {/* Analyse de l'effort */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Analyse de l'effort
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {derivedMetrics.primaryZone && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Zone d'effort principale</span>
              <Badge className={getZoneColor(derivedMetrics.primaryZone)}>
                {derivedMetrics.primaryZone}
              </Badge>
            </div>
          )}

          {activity?.average_heartrate && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">FC moyenne</span>
              <span className="font-medium">{Math.round(activity.average_heartrate)} bpm</span>
            </div>
          )}

          {activity?.max_heartrate && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">FC maximale</span>
              <span className="font-medium">{Math.round(activity.max_heartrate)} bpm</span>
            </div>
          )}

          {derivedMetrics.heartRateVariability && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Variabilité FC</span>
              <span className="font-medium">{derivedMetrics.heartRateVariability} bpm</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analyse de la régularité */}
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
            <span className="font-medium">{formatPace(activity?.average_speed)}</span>
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

      {/* Métriques de course */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            Métriques de course
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {derivedMetrics.hasCadenceData && derivedMetrics.avgCadence && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cadence moyenne</span>
              <span className="font-medium">{derivedMetrics.avgCadence} pas/min</span>
            </div>
          )}

          {derivedMetrics.avgElevationGainPerKm && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Dénivelé moyen/km</span>
              <span className="font-medium">{derivedMetrics.avgElevationGainPerKm} m</span>
            </div>
          )}

          {activity?.distance && activity?.moving_time && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Vitesse moyenne</span>
              <span className="font-medium">
                {((activity.distance / 1000) / (activity.moving_time / 3600)).toFixed(1)} km/h
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zones d'entraînement */}
      {derivedMetrics.effortZones && (
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
                <span>&lt; {derivedMetrics.effortZones.zone1} bpm</span>
              </div>
              <div className="flex justify-between">
                <span>Zone 2 (Aérobie légère)</span>
                <span>{derivedMetrics.effortZones.zone1} - {derivedMetrics.effortZones.zone2} bpm</span>
              </div>
              <div className="flex justify-between">
                <span>Zone 3 (Aérobie)</span>
                <span>{derivedMetrics.effortZones.zone2} - {derivedMetrics.effortZones.zone3} bpm</span>
              </div>
              <div className="flex justify-between">
                <span>Zone 4 (Seuil)</span>
                <span>{derivedMetrics.effortZones.zone3} - {derivedMetrics.effortZones.zone4} bpm</span>
              </div>
              <div className="flex justify-between">
                <span>Zone 5 (Anaérobie)</span>
                <span>&gt; {derivedMetrics.effortZones.zone4} bpm</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conseils d'amélioration */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Zap className="h-5 w-5" />
            Conseils d'amélioration
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 space-y-2">
          {consistencyData.score < 60 && (
            <p>• Travaillez la régularité d'allure avec des séances au tempo</p>
          )}
          {derivedMetrics.hasCadenceData && derivedMetrics.avgCadence && derivedMetrics.avgCadence < 170 && (
            <p>• Augmentez votre cadence pour améliorer l'efficacité (objectif: 170-180 pas/min)</p>
          )}
          {derivedMetrics.primaryZone === 'Anaérobie' && (
            <p>• Intégrez plus de séances en zones 1-2 pour développer l'endurance</p>
          )}
          {!derivedMetrics.hasCadenceData && (
            <p>• Utilisez un capteur de cadence pour des analyses plus précises</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricsAnalysis;
