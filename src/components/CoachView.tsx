
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTrainingRecommendations } from '@/hooks/useTrainingRecommendations';
import { useAICoach } from '@/hooks/useAICoach';
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
  const { settings, updateSettings, refreshRecommendations } = useTrainingRecommendations();
  const { 
    analysisData, 
    isLoading: aiLoading, 
    scheduledDate,
    generateRecommendations,
    updateScheduledDate,
    reanalyzeWithNewDate
  } = useAICoach();
  
  useActivityMatching();
  
  const [activeTab, setActiveTab] = useState('ai-generator');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isSchedulingModalOpen, setIsSchedulingModalOpen] = useState(false);

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
    toast({
      title: "Ressenti mis à jour",
      description: "Vos prochaines analyses IA tiendront compte de ce ressenti",
    });
  };

  return (
    <div className="mobile-container mobile-section-spacing space-y-4 sm:space-y-6 lg:space-y-8">
      {/* En-tête avec analyse IA adaptative */}
        <CoachHeader
          analysisData={analysisData}
          settings={settings}
          aiLoading={aiLoading}
          onUpdateSettings={updateSettings}
          onAIAnalysis={handleAIAnalysis}
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

      {/* Onglets pour les recommandations simplifiés */}
      <CoachTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Résumé enrichi avec objectifs personnels */}
      <CoachSummary
        settings={settings}
        analysisData={analysisData}
        persistentRecommendations={[]}
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
