
import { useState } from 'react';
import { Brain, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import PersonalizedRecommendations from './PersonalizedRecommendations';
import TrainingSettings from './TrainingSettings';
import { useTrainingRecommendations } from '@/hooks/useTrainingRecommendations';

const CoachView = () => {
  const { toast } = useToast();
  const { recommendations, settings, updateSettings, refreshRecommendations } = useTrainingRecommendations();

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

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* En-tête minimaliste */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Brain className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Coach IA
            </h2>
            <p className="text-gray-600 text-sm">
              Recommandations personnalisées basées sur vos {85} activités
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <TrainingSettings 
            settings={settings}
            onUpdateSettings={updateSettings}
          />
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

      {/* Zone centrale des recommandations */}
      <div className="max-w-4xl mx-auto">
        <PersonalizedRecommendations 
          recommendations={recommendations}
          onStartSession={handleStartSession}
        />
      </div>

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
        </p>
      </div>
    </div>
  );
};

export default CoachView;
