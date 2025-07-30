
import React, { useState } from 'react';
import { TrendingUp, Clock, Trash2, Calendar, MapPin } from 'lucide-react';
import { formatDistance, formatDuration, formatPace, formatDate, formatElevation } from '@/utils/activityHelpers';
import { useDeleteActivity } from '@/hooks/useDeleteActivity';
import { DeleteActivityDialog } from './DeleteActivityDialog';
import { TruncatedText } from '@/components/ui/truncated-text';

interface Activity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number | null;
  start_date_local: string;
}

interface ActivitiesTableMobileProps {
  activities: Activity[];
  onActivityClick: (activityId: number) => void;
  onActivityDeleted?: () => void;
}

export const ActivitiesTableMobile: React.FC<ActivitiesTableMobileProps> = ({
  activities,
  onActivityClick,
  onActivityDeleted
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);
  
  const { deleteActivity, isDeleting } = useDeleteActivity({
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
      onActivityDeleted?.();
    }
  });

  const handleDeleteClick = (e: React.MouseEvent, activity: Activity) => {
    e.stopPropagation();
    setActivityToDelete(activity);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (activityToDelete) {
      await deleteActivity(activityToDelete.id, activityToDelete.name);
    }
  };

  return (
    <>
      <div className="md:hidden mobile-viewport-container">
        {activities.map((activity) => (
          <div 
            key={activity.id} 
            className="p-3 sm:p-4 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors mobile-touch-target active:bg-gray-100 relative mobile-smooth-transition mobile-w-full mobile-no-overflow"
            onClick={() => onActivityClick(activity.id)}
          >
            {/* Header avec titre et date */}
            <div className="mobile-flex-container justify-between items-start mb-2 gap-2">
              <div className="mobile-flex-item min-w-0 pr-2">
                <TruncatedText
                  text={activity.name}
                  maxLength={25}
                  useFallbackAt={15}
                  fallbackIcon={<TrendingUp size={16} className="text-running-blue" />}
                  className="font-semibold text-gray-800 mobile-text-responsive leading-tight block mobile-prevent-overflow"
                  showTooltip={true}
                />
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1 text-gray-500">
                  <Calendar size={12} className="flex-shrink-0" />
                  <span className="mobile-text-responsive whitespace-nowrap mobile-prevent-overflow">
                    {formatDate(activity.start_date_local)}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDeleteClick(e, activity)}
                  className="mobile-touch-target-xs p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors mobile-smooth-transition flex-shrink-0"
                  title="Supprimer cette activité"
                  aria-label="Supprimer cette activité"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            {/* Métriques principales en grille adaptative */}
            <div className="mobile-fluid-grid mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <TrendingUp size={14} className="text-running-blue flex-shrink-0" />
                <span className="font-medium mobile-text-responsive-sm mobile-truncate-smart">
                  {formatDistance(activity.distance)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <Clock size={14} className="text-green-600 flex-shrink-0" />
                <span className="font-medium mobile-text-responsive-sm mobile-truncate-smart">
                  {formatDuration(activity.moving_time)}
                </span>
              </div>
            </div>
            
            {/* Métriques secondaires compactes */}
            <div className="mobile-flex-container items-center gap-3 mobile-text-responsive text-gray-600 overflow-hidden">
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="font-medium">Allure:</span>
                <span className="mobile-prevent-overflow">{formatPace(activity.distance, activity.moving_time)}</span>
              </div>
              {activity.total_elevation_gain && (
                <>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-gray-400">•</span>
                    <span className="font-medium">D+:</span>
                    <span className="mobile-prevent-overflow">{formatElevation(activity.total_elevation_gain)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <DeleteActivityDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        activityName={activityToDelete?.name || ''}
        isDeleting={isDeleting}
      />
    </>
  );
};
