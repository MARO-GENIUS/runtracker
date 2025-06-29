
import { useState } from 'react';
import { Brain, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import PersonalizedRecommendations from './PersonalizedRecommendations';
import AIPersonalizedRecommendations from './AIPersonalizedRecommendations';
import TrainingSettings from './TrainingSettings';
import { useTrainingRecommendations } from '@/hooks/useTrainingRecommendations';
import { useAICoach } from '@/hooks/useAICoach';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CoachView = () => {
  const { toast } = useToast();
  const { recommendations, settings, updateSettings, refreshRecommendations } = useTrainingRecommendations();
  const { 
    recommendations: aiRecommendations, 
    analysisData, 
    isLoading: aiLoading, 
    generateRecommendations 
  } = useAICoach();
  
  const [activeTab, setActiveTab] = useState('ai');

  const handleStartSession = (recommendation: any) => {
    toast({
      title: "Séance planifiée",
      description: `${recommendation.title} ajoutée à votre planning`,
    });
  };

  const handleRefresh = () => {
    refreshRecommendations();
    toast({
      title: "Recommandations mises à jour",
      description: "Nouvelles suggestions basées sur vos dernières activités",
    });
  };

  const handleAIAnalysis = async () => {
    await generateRecommendations();
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* En-tête avec analyse IA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
            <Brain className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Coach IA
            </h2>
            <p className="text-gray-600 text-sm">
              Recommandations personnalisées basées sur vos {analysisData?.totalActivities || 85} activités
              {analysisData && (
                <span className="ml-2 text-blue-600">
                  • Moy: {analysisData.averageDistance}km • Dernière: {analysisData.lastActivity}
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <TrainingSettings 
            settings={settings}
            onUpdateSettings={updateSettings}
          />
          <Button 
            onClick={handleAIAnalysis}
            disabled={aiLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {aiLoading ? 'Analyse en cours...' : 'Analyser avec l\'IA'}
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleRefresh}
            className="text-gray-500 hover:text-gray-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Onglets pour basculer entre IA et recommandations basiques */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Coach IA
            {aiRecommendations.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                {aiRecommendations.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Recommandations basiques
            {recommendations.length > 0 && (
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full">
                {recommendations.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="ai" className="mt-6">
          <div className="max-w-4xl mx-auto">
            <AIPersonalizedRecommendations 
              recommendations={aiRecommendations}
              onStartSession={handleStartSession}
              isLoading={aiLoading}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="basic" className="mt-6">
          <div className="max-w-4xl mx-auto">
            <PersonalizedRecommendations 
              recommendations={recommendations}
              onStartSession={handleStartSession}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Résumé discret en bas */}
      <div className="text-center text-sm text-gray-500 pt-4 border-t">
        <p>
          Objectif actuel : <span className="font-medium">{
            settings.targetRace === '5k' ? '5 kilomètres' :
            settings.targetRace === '10k' ? '10 kilomètres' :
            settings.targetRace === 'semi' ? 'Semi-marathon' :
            settings.targetRace === 'marathon' ? 'Marathon' :
            'Récupération/Forme'
          }</span>
          {' • '}
          <span className="font-medium">{settings.weeklyFrequency} séances/semaine</span>
          {analysisData && (
            <>
              {' • '}
              <span className="text-blue-600 font-medium">IA: {analysisData.totalActivities} activités analysées</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default CoachView;
