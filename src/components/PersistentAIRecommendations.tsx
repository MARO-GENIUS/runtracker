
import { useState } from 'react';
import { AIRecommendation } from '@/hooks/useAICoach';
import ActivitySelectionDialog from './ActivitySelectionDialog';
import { useActivities } from '@/hooks/useActivities';
import { useManualActivityAssociation } from '@/hooks/useManualActivityAssociation';
import RecommendationStatsCard from './recommendations/RecommendationStatsCard';
import RecommendationCard from './recommendations/RecommendationCard';
import EmptyRecommendations from './recommendations/EmptyRecommendations';
import LoadingRecommendations from './recommendations/LoadingRecommendations';

interface PersistentRecommendation {
  id: string;
  recommendation_data: AIRecommendation;
  generated_at: string;
  completed_at?: string;
  matching_activity_id?: number;
  status: 'pending' | 'completed' | 'expired';
  is_manual_match?: boolean;
}

interface PersistentAIRecommendationsProps {
  recommendations: PersistentRecommendation[];
  isLoading: boolean;
  onRemoveRecommendation?: (id: string) => void;
  onRecommendationUpdate?: () => void;
}

const PersistentAIRecommendations = ({ 
  recommendations, 
  isLoading, 
  onRemoveRecommendation,
  onRecommendationUpdate 
}: PersistentAIRecommendationsProps) => {
  const [expandedCards, setExpandedCards] = useState<number[]>([]);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<PersistentRecommendation | null>(null);
  
  // Get activities for association
  const { activities } = useActivities({ limit: 100 });
  const { 
    associateActivityToRecommendation, 
    dissociateActivityFromRecommendation, 
    isAssociating 
  } = useManualActivityAssociation();

  const toggleExpanded = (index: number) => {
    setExpandedCards(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleAssociateClick = (rec: PersistentRecommendation) => {
    setSelectedRecommendation(rec);
    setActivityDialogOpen(true);
  };

  const handleActivityAssociation = async (activityId: number) => {
    if (!selectedRecommendation) return;
    
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;

    const success = await associateActivityToRecommendation(
      selectedRecommendation.id,
      activityId,
      activity.name,
      selectedRecommendation.recommendation_data.title
    );

    if (success) {
      setActivityDialogOpen(false);
      setSelectedRecommendation(null);
      // Trigger parent to refresh recommendations
      if (onRecommendationUpdate) {
        onRecommendationUpdate();
      }
    }
  };

  const handleDissociation = async (rec: PersistentRecommendation) => {
    const success = await dissociateActivityFromRecommendation(
      rec.id,
      rec.recommendation_data.title
    );

    if (success && onRecommendationUpdate) {
      onRecommendationUpdate();
    }
  };

  if (isLoading) {
    return <LoadingRecommendations />;
  }

  if (recommendations.length === 0) {
    return <EmptyRecommendations />;
  }

  const completedCount = recommendations.filter(r => r.status === 'completed').length;
  const totalCount = recommendations.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      <RecommendationStatsCard 
        completedCount={completedCount}
        totalCount={totalCount}
        completionRate={completionRate}
      />

      {recommendations.map((persistentRec, index) => (
        <RecommendationCard
          key={persistentRec.id}
          persistentRec={persistentRec}
          index={index}
          isExpanded={expandedCards.includes(index)}
          isAssociating={isAssociating}
          onToggleExpanded={() => toggleExpanded(index)}
          onAssociateClick={handleAssociateClick}
          onDissociation={handleDissociation}
          onRemoveRecommendation={onRemoveRecommendation}
        />
      ))}

      {selectedRecommendation && (
        <ActivitySelectionDialog
          isOpen={activityDialogOpen}
          onClose={() => {
            setActivityDialogOpen(false);
            setSelectedRecommendation(null);
          }}
          onConfirm={handleActivityAssociation}
          activities={activities}
          recommendation={selectedRecommendation.recommendation_data}
          isLoading={isAssociating}
        />
      )}
    </div>
  );
};

export default PersistentAIRecommendations;
