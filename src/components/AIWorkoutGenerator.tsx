
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Brain, 
  Play, 
  RefreshCw, 
  CheckCircle, 
  Target, 
  Timer, 
  Heart, 
  Zap,
  ChevronDown,
  ChevronUp,
  Activity,
  Trophy,
  AlertCircle,
  Info
} from 'lucide-react';
import { useStravaLast30Days } from '@/hooks/useStravaLast30Days';
import { useAIWorkoutGenerator } from '@/hooks/useAIWorkoutGenerator';
import { usePersonalRecords } from '@/hooks/usePersonalRecords';
import { calculateTrainingZones } from '@/utils/trainingZones';

const AIWorkoutGenerator: React.FC = () => {
  const [selectedVariant, setSelectedVariant] = useState<'normal' | 'facile' | 'difficile'>('normal');
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [showZones, setShowZones] = useState(false);
  
  const stravaData = useStravaLast30Days();
  const { records: personalRecords, loading: recordsLoading, error: recordsError } = usePersonalRecords();
  const { workout, loading, error, generateWorkout, markAsCompleted, generateNewWorkout, lastSessionType } = useAIWorkoutGenerator();

  // Calculer les zones d'entraînement
  const trainingZones = personalRecords ? calculateTrainingZones(personalRecords) : null;

  const handleGenerateWorkout = () => {
    if (!stravaData.loading && stravaData.activities.length > 0) {
      generateWorkout(stravaData);
    }
  };

  const handleGenerateNewWorkout = () => {
    if (!stravaData.loading && stravaData.activities.length > 0) {
      generateNewWorkout(stravaData);
    }
  };

  const handleMarkAsCompleted = () => {
    markAsCompleted();
  };

  const getRPEColor = (rpe: number) => {
    if (rpe <= 3) return 'bg-green-100 text-green-800';
    if (rpe <= 6) return 'bg-yellow-100 text-yellow-800';
    if (rpe <= 8) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'interval':
      case 'intervals':
        return <Zap className="h-4 w-4" />;
      case 'tempo':
      case 'threshold':
        return <Target className="h-4 w-4" />;
      case 'long run':
      case 'easy run':
        return <Timer className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (stravaData.loading || recordsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Chargement de vos données...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (stravaData.error || recordsError) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-600">
            <p>Erreur lors du chargement des données: {stravaData.error || recordsError}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section informations contextuelles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            Coach IA - Générateur de séances personnalisées
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Activités (30j)</p>
              <p className="text-2xl font-bold text-blue-600">{stravaData.activities.length}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Objectif actuel</p>
              <p className="text-lg font-semibold text-green-600">
                {stravaData.currentGoal?.distance || 'Non défini'}
              </p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Distance totale</p>
              <p className="text-lg font-semibold text-purple-600">
                {stravaData.activities.reduce((sum, activity) => sum + activity.distance_km, 0).toFixed(1)} km
              </p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="h-4 w-4 text-orange-600" />
                <p className="text-sm text-gray-600">Records</p>
              </div>
              <p className="text-lg font-semibold text-orange-600">{personalRecords.length}</p>
            </div>
          </div>

          {/* Indicateur de dernière séance */}
          {lastSessionType && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Dernière séance détectée automatiquement</span>
              </div>
              <div className="flex items-center gap-2">
                {getTypeIcon(lastSessionType)}
                <span className="text-blue-700 font-medium">{lastSessionType}</span>
                <span className="text-xs text-blue-600">(prise en compte pour la génération)</span>
              </div>
            </div>
          )}

          {/* Affichage des zones d'entraînement personnalisées */}
          {trainingZones && (
            <div className="mt-4">
              <Collapsible open={showZones} onOpenChange={setShowZones}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span>Vos zones d'intensité personnalisées</span>
                    </div>
                    {showZones ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 border rounded-lg bg-red-50 border-red-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="h-4 w-4 text-red-600" />
                        <span className="font-semibold text-red-800">VMA</span>
                      </div>
                      <p className="text-sm text-red-700">{trainingZones.vma.min}/km - {trainingZones.vma.max}/km</p>
                    </div>
                    <div className="p-3 border rounded-lg bg-orange-50 border-orange-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="h-4 w-4 text-orange-600" />
                        <span className="font-semibold text-orange-800">Seuil</span>
                      </div>
                      <p className="text-sm text-orange-700">{trainingZones.seuil.min}/km - {trainingZones.seuil.max}/km</p>
                    </div>
                    <div className="p-3 border rounded-lg bg-yellow-50 border-yellow-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Timer className="h-4 w-4 text-yellow-600" />
                        <span className="font-semibold text-yellow-800">Tempo</span>
                      </div>
                      <p className="text-sm text-yellow-700">{trainingZones.tempo.min}/km - {trainingZones.tempo.max}/km</p>
                    </div>
                    <div className="p-3 border rounded-lg bg-green-50 border-green-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Heart className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-800">Endurance</span>
                      </div>
                      <p className="text-sm text-green-700">{trainingZones.endurance.min}/km - {trainingZones.endurance.max}/km</p>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Zones calculées automatiquement</span>
                    </div>
                    <p className="text-xs text-blue-700">
                      Ces allures sont basées sur vos records personnels et seront utilisées par l'IA pour générer des séances précises.
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
          
          {/* Only show generate button if no workout is currently displayed */}
          {!workout && !loading && (
            <div className="text-center pt-4">
              <Button 
                onClick={handleGenerateWorkout}
                disabled={loading || stravaData.activities.length === 0}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Générer ma séance du jour
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading state - only show during generation */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Génération de votre séance personnalisée...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Séance générée - persists until user action */}
      {workout && !loading && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {getTypeIcon(workout.type)}
                  {workout.type}
                </CardTitle>
                <p className="text-gray-600 mt-1">{workout.structure}</p>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                {getTypeIcon(workout.type)}
                {workout.type}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Variantes */}
            <Tabs value={selectedVariant} onValueChange={(v) => setSelectedVariant(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="facile">Facile</TabsTrigger>
                <TabsTrigger value="normal">Normal</TabsTrigger>
                <TabsTrigger value="difficile">Difficile</TabsTrigger>
              </TabsList>
              
              <TabsContent value="normal" className="mt-6">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Structure</p>
                        <p className="font-semibold">{workout.structure}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Allure cible</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Timer className="h-4 w-4" />
                          {workout.allure_cible}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">FC Cible</p>
                        <p className="font-semibold flex items-center gap-1">
                          <Heart className="h-4 w-4 text-red-500" />
                          {workout.fc_cible}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Durée</p>
                        <p className="font-semibold">{workout.durée_estimée}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Kilométrage total</p>
                        <p className="font-semibold">{workout.kilométrage_total}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Justification</p>
                        <p className="text-sm">{workout.justification}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="facile" className="mt-6">
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="pt-4">
                    <p className="text-green-800 font-medium">Variante facile :</p>
                    <p className="mt-2">Réduire l'intensité et la durée de 20%</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="difficile" className="mt-6">
                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="pt-4">
                    <p className="text-red-800 font-medium">Variante difficile :</p>
                    <p className="mt-2">Augmenter l'intensité et la durée de 20%</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Explication du coach */}
            <Collapsible open={isExplanationOpen} onOpenChange={setIsExplanationOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full flex items-center justify-between">
                  <span>Explication du coach</span>
                  {isExplanationOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <Card className="bg-blue-50">
                  <CardContent className="pt-4">
                    <p className="text-blue-900">{workout.justification}</p>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            {/* Boutons d'action - only these buttons can clear the workout */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button 
                onClick={handleMarkAsCompleted}
                className="bg-green-600 hover:bg-green-700 flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Marquer comme effectuée
              </Button>
              <Button 
                onClick={handleGenerateNewWorkout}
                variant="outline"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Proposer une autre séance
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && !loading && (
        <Card className="border-red-200">
          <CardContent className="pt-4">
            <div className="text-red-600">
              <p className="font-medium">Erreur lors de la génération :</p>
              <p className="mt-1">{error}</p>
              <Button 
                onClick={handleGenerateWorkout}
                variant="outline"
                className="mt-3"
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIWorkoutGenerator;
