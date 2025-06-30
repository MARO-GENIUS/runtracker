import { useState } from 'react';
import { Brain, RefreshCw, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import PersonalizedRecommendations from './PersonalizedRecommendations';
import AIPersonalizedRecommendations from './AIPersonalizedRecommendations';
import PersistentAIRecommendations from './PersistentAIRecommendations';
import QuickEffortRating from './QuickEffortRating';
import AdaptiveAnalysisDisplay from './AdaptiveAnalysisDisplay';
import TrainingSettings from './TrainingSettings';
import { useTrainingRecommendations } from '@/hooks/useTrainingRecommendations';
import { useAICoach } from '@/hooks/useAICoach';
import { usePersistentAIRecommendations } from '@/hooks/usePersistentAIRecommendations';
import { useActivityMatching } from '@/hooks/useActivityMatching';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SchedulingModal from './SchedulingModal';
import ScheduledDateManager from './ScheduledDateManager';

const CoachView = () => {
  const { toast } = useToast();
  const { recommendations, settings, updateSettings, refreshRecommendations } = useTrainingRecommendations();
  const { 
    recommendations: aiRecommendations, 
    analysisData, 
    isLoading: aiLoading, 
    scheduledDate,
    generateRecommendations,
    updateScheduledDate,
    reanalyzeWithNewDate
  } = useAICoach();
  
  const {
    persistentRecommendations,
    isLoading: persistentLoading,
    removeRecommendation,
    loadRecommendations
  } = usePersistentAIRecommendations();
  
  useActivityMatching();
  
  const [activeTab, setActiveTab] = useState('persistent-ai');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);

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
    setIsSchedulingModalOpen(true);
  };

  const handleScheduledAnalysis = async (plannedDate: Date) => {
    setShowAnalysis(true);
    await generateRecommendations(plannedDate);
  };

  const handleDateChange = (newDate: Date) => {
    updateScheduledDate(newDate);
  };

  const handleReanalyze = async () => {
    await reanalyzeWithNewDate();
  };

  const handleRatingUpdated = () => {
    // Recharger les recommandations persistantes pour voir les changements
    loadRecommendations();
    toast({
      title: "Ressenti mis à jour",
      description: "Vos prochaines analyses IA tiendront compte de ce ressenti",
    });
  };

  const handleRemoveRecommendation = async (recommendationId: string) => {
    await removeRecommendation(recommendationId);
  };

  const daysSinceLastActivity = analysisData?.daysSinceLastActivity;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* En-tête avec analyse IA adaptative */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
            <Brain className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Coach IA Adaptatif
            </h2>
            <p className="text-gray-600 text-sm">
              Analyse intelligente de vos {analysisData?.totalActivities || 'dernières'} courses
              {daysSinceLastActivity !== undefined && (
                <span className="ml-2 text-orange-600 font-medium">
                  • {daysSinceLastActivity} jour{daysSinceLastActivity > 1 ? 's' : ''} depuis la dernière séance
                </span>
              )}
              {analysisData?.fatigueScore && (
                <span className="ml-2 text-blue-600">
                  • Fatigue: {analysisData.fatigueScore}/10
                </span>
              )}
              {analysisData?.workoutBalance && (
                <span className="ml-2 text-purple-600">
                  • {analysisData.workoutBalance}
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
            variant="outline"
            size="sm"
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="hidden sm:flex"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            {showAnalysis ? 'Masquer analyse' : 'Voir analyse'}
          </Button>
          <Button 
            onClick={handleAIAnalysis}
            disabled={aiLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {aiLoading ? 'Analyse adaptative...' : 'Analyser avec l\'IA'}
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

      {/* Gestionnaire de date planifiée */}
      {scheduledDate && (
        <ScheduledDateManager
          scheduledDate={scheduledDate.toISOString()}
          onDateChange={handleDateChange}
          onReanalyze={handleReanalyze}
          isReanalyzing={aiLoading}
        />
      )}

      {/* Affichage de l'analyse adaptative */}
      <AdaptiveAnalysisDisplay 
        analysisData={analysisData} 
        isVisible={showAnalysis && !!analysisData} 
      />

      {/* Widget de ressenti rapide */}
      <QuickEffortRating onRatingUpdated={handleRatingUpdated} />

      {/* Onglets pour les recommandations */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="persistent-ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Suivi IA
            {persistentRecommendations.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                {persistentRecommendations.filter(r => r.status === 'pending').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Nouvelles IA
            {aiRecommendations.length > 0 && (
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
                {aiRecommendations.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Basiques
            {recommendations.length > 0 && (
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full">
                {recommendations.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="persistent-ai" className="mt-6">
          <div className="max-w-4xl mx-auto">
            <PersistentAIRecommendations 
              recommendations={persistentRecommendations}
              isLoading={persistentLoading}
              onRemoveRecommendation={handleRemoveRecommendation}
            />
          </div>
        </TabsContent>
        
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

      {/* Résumé enrichi */}
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
          {persistentRecommendations.length > 0 && (
            <>
              {' • '}
              <span className="text-blue-600 font-medium">
                IA: {persistentRecommendations.filter(r => r.status === 'completed').length}/{persistentRecommendations.length} réalisées
              </span>
            </>
          )}
          {daysSinceLastActivity !== undefined && (
            <>
              {' • '}
              <span className="text-orange-600 font-medium">
                Dernière séance: il y a {daysSinceLastActivity} jour{daysSinceLastActivity > 1 ? 's' : ''}
              </span>
            </>
          )}
          {analysisData?.fatigueScore && (
            <>
              {' • '}
              <span className="text-purple-600 font-medium">
                Fatigue: {analysisData.fatigueScore}/10
              </span>
            </>
          )}
        </p>
      </div>

      {/* Modal de planification */}
      <SchedulingModal
        isOpen={isSchedulingModalOpen}
        onClose={() => setIsSchedulingModalOpen(false)}
        onSchedule={handleScheduledAnalysis}
        daysSinceLastActivity={daysSinceLastActivity}
      />
    </div>
  );
};

export default CoachView;
