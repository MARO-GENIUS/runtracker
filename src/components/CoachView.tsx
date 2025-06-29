
import { useState } from 'react';
import { Brain, Target, Calendar, TrendingUp, Activity, Zap, BarChart3, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BiometricDataForm from './BiometricDataForm';
import MetricsAnalysis from './MetricsAnalysis';
import { useEnhancedMetrics } from '@/hooks/useEnhancedMetrics';

const CoachView = () => {
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const { enhancedData, loading, error, fetchEnhancedData } = useEnhancedMetrics();

  const handleAnalyzeActivity = () => {
    // Pour la démo, on peut utiliser un ID d'activité fixe ou permettre à l'utilisateur d'en saisir un
    const activityId = prompt('ID de l\'activité à analyser:');
    if (activityId) {
      const id = parseInt(activityId);
      setSelectedActivityId(id);
      fetchEnhancedData(id);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* En-tête de bienvenue */}
      <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 sm:p-8 border border-blue-100">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-500 rounded-full">
            <Brain className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Votre Coach IA Personnalisé
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Analysez vos performances avec des métriques avancées et obtenez des conseils personnalisés
        </p>
      </div>

      {/* Onglets principaux */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="analysis">Analyse</TabsTrigger>
          <TabsTrigger value="biometric">Données</TabsTrigger>
          <TabsTrigger value="training">Entraînement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Grille des fonctionnalités */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Analyse des performances */}
            <Card className="border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Analyse Avancée</CardTitle>
                    <CardDescription>
                      Métriques calculées et zones d'effort
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Zones de fréquence cardiaque personnalisées</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Analyse de la régularité d'allure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Variabilité de la fréquence cardiaque</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Dénivelé moyen par kilomètre</span>
                  </div>
                </div>
                <Button 
                  onClick={handleAnalyzeActivity} 
                  className="w-full mt-4"
                  variant="outline"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analyser une activité
                </Button>
              </CardContent>
            </Card>

            {/* Configuration des objectifs */}
            <Card className="border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Objectifs Personnalisés</CardTitle>
                    <CardDescription>
                      Définissez vos ambitions et échéances
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Choix du type d'épreuve (5K, 10K, semi, marathon)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Objectif de temps ou d'allure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Date cible de l'épreuve</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Prédictions basées sur l'historique</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Planification des séances */}
            <Card className="border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Planification Intelligente</CardTitle>
                    <CardDescription>
                      Un programme adapté à votre emploi du temps
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Nombre de séances par semaine</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Créneaux préférés d'entraînement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Alternance travail/récupération</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Adaptation selon la progressivité</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Données biométriques */}
            <Card className="border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Activity className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Données Biométriques</CardTitle>
                    <CardDescription>
                      Enrichissez vos analyses avec des données manuelles
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <span>Puissance de course et cadence</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <span>Longueur de foulée et oscillation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <span>Ressenti d'effort et récupération</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <span>Notes et observations personnelles</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {loading && (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p>Analyse en cours...</p>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {enhancedData && (
            <MetricsAnalysis 
              derivedMetrics={enhancedData.derivedMetrics}
              activity={enhancedData.activity}
            />
          )}

          {!enhancedData && !loading && !error && (
            <Card>
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Aucune analyse disponible</p>
                <Button onClick={handleAnalyzeActivity}>
                  Analyser une activité
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="biometric" className="space-y-6">
          <BiometricDataForm 
            activityId={selectedActivityId || undefined}
            onSave={(data) => console.log('Biometric data saved:', data)}
          />
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
            <CardContent className="p-6 sm:p-8">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <Zap className="h-4 w-4" />
                  Prochainement disponible
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Programmes d'Entraînement Personnalisés
                </h3>
                <p className="text-gray-600 mb-4 max-w-3xl mx-auto">
                  Notre IA créera bientôt des programmes d'entraînement sur mesure basés sur vos analyses 
                  de performance, vos objectifs et votre disponibilité.
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <span>Plans d'entraînement adaptatifs</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <span>Séances personnalisées</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <span>Suivi de progression</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoachView;
