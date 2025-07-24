
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ActivityDetailView } from './ActivityDetailView';
import { useOptimizedActivityDetail } from '@/hooks/useOptimizedActivityDetail';

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityId: number | null;
}

const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  isOpen,
  onClose,
  activityId
}) => {
  const { activity, loading, error, fetchActivityDetail } = useOptimizedActivityDetail();

  React.useEffect(() => {
    if (isOpen && activityId) {
      fetchActivityDetail(activityId);
    }
  }, [isOpen, activityId, fetchActivityDetail]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {activity?.name || 'Détails de l\'activité'}
          </DialogTitle>
        </DialogHeader>
        
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-running-blue"></div>
          </div>
        )}
        
        {error && (
          <div className="text-red-600 text-center py-4">
            {error}
          </div>
        )}
        
        {activity && !loading && (
          <ActivityDetailView activity={activity} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ActivityDetailModal;
