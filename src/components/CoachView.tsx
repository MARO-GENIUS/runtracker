
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTrainingRecommendations } from '@/hooks/useTrainingRecommendations';
import { useAICoach } from '@/hooks/useAICoach';
import { usePersistentAIRecommendations } from '@/hooks/usePersistentAIRecommendations';
import { useActivityMatching } from '@/hooks/useActivityMatching';
import { CoachHeader } from './coach/CoachHeader';
import { CoachTabs } from './coach/CoachTabs';
import { CoachSummary } from './coach/CoachSummary';
import QuickEffortRating from './QuickEffortRating';
import AdaptiveAnalysisDisplay from './AdaptiveAnalysisDisplay';
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
  
  const [activeTab, setActiveTab] = useState('weekly-view');
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
    loadRecommendations();
    toast({
      title: "Ressenti mis à jour",
      description: "Vos prochaines analyses IA tiendront compte de ce ressenti",
    });
  };

  const handleRemoveRecommendation = async (recommendationId: string) => {
    await removeRecommendation(recommendationId);
  };

  const handleRecommendationUpdate = () => {
    loadRecommendations();
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* En-tête avec analyse IA adaptative */}
      <CoachHeader
        analysisData={analysisData}
        settings={settings}
        showAnalysis={showAnalysis}
        aiLoading={aiLoading}
        onUpdateSettings={updateSettings}
        onToggleAnalysis={() => setShowAnalysis(!showAnalysis)}
        onAIAnalysis={handleAIAnalysis}
        onRefresh={handleRefresh}
      />

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
      <CoachTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        persistentRecommendations={persistentRecommendations}
        aiRecommendations={aiRecommendations}
        recommendations={recommendations}
        aiLoading={aiLoading}
        persistentLoading={persistentLoading}
        onStartSession={handleStartSession}
        onRemoveRecommendation={handleRemoveRecommendation}
        onRecommendationUpdate={handleRecommendationUpdate}
      />

      {/* Résumé enrichi avec objectifs personnels */}
      <CoachSummary
        settings={settings}
        analysisData={analysisData}
        persistentRecommendations={persistentRecommendations}
      />

      {/* Modal de planification */}
      <SchedulingModal
        isOpen={isSchedulingModalOpen}
        onClose={() => setIsSchedulingModalOpen(false)}
        onSchedule={handleScheduledAnalysis}
        daysSinceLastActivity={analysisData?.daysSinceLastActivity}
      />
    </div>
  );
};

export default CoachView;
