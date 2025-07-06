
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AIRecommendation } from '@/hooks/useAICoach';
import ActivitySelectionHeader from './activity-selection/ActivitySelectionHeader';
import RecommendationSummary from './activity-selection/RecommendationSummary';
import ActivitySearchInput from './activity-selection/ActivitySearchInput';
import ActivityList from './activity-selection/ActivityList';
import SelectedActivitySummary from './activity-selection/SelectedActivitySummary';

interface Activity {
  id: number;
  name: string;
  distance: number;
  start_date_local: string;
  type: string;
  location_city?: string;
  moving_time: number;
}

interface ActivitySelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (activityId: number) => void;
  activities: Activity[];
  recommendation: AIRecommendation;
  isLoading?: boolean;
}

const ActivitySelectionDialog = ({
  isOpen,
  onClose,
  onConfirm,
  activities,
  recommendation,
  isLoading = false
}: ActivitySelectionDialogProps) => {
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Protection contre recommendation undefined
  if (!recommendation || !recommendation.type) {
    return null;
  }

  const selectedActivity = activities.find(a => a.id === selectedActivityId);

  const filteredActivities = activities.filter(activity =>
    activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (activity.location_city && activity.location_city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleConfirm = () => {
    if (selectedActivityId) {
      onConfirm(selectedActivityId);
    }
  };

  const handleClose = () => {
    setSelectedActivityId(null);
    setSearchTerm('');
    onClose();
  };

  const handleActivityClick = (activityId: number) => {
    console.log('Activity clicked:', activityId);
    setSelectedActivityId(activityId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col z-50">
        <ActivitySelectionHeader />

        <RecommendationSummary recommendation={recommendation} />

        <ActivitySearchInput 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <ActivityList
          activities={filteredActivities}
          selectedActivityId={selectedActivityId}
          onActivityClick={handleActivityClick}
        />

        {selectedActivity && (
          <SelectedActivitySummary activity={selectedActivity} />
        )}

        <DialogFooter className="flex-shrink-0 pt-4 z-10 relative bg-white">
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedActivityId || isLoading}
          >
            {isLoading ? 'Association...' : 'Confirmer l\'association'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ActivitySelectionDialog;
