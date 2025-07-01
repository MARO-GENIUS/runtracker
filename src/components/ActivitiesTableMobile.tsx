
import React, { useState } from 'react';
import { TrendingUp, Clock, Trash2 } from 'lucide-react';
import { formatDistance, formatDuration, formatPace, formatDate, formatElevation } from '@/utils/activityHelpers';
import { useDeleteActivity } from '@/hooks/useDeleteActivity';
import { DeleteActivityDialog } from './DeleteActivityDialog';

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
      <div className="md:hidden">
        {activities.map((activity) => (
          <div 
            key={activity.id} 
            className="p-4 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors min-h-[60px] active:bg-gray-100 relative"
            onClick={() => onActivityClick(activity.id)}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-gray-800 text-sm leading-tight pr-2 flex-1">
                {activity.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {formatDate(activity.start_date_local)}
                </span>
                <button
                  onClick={(e) => handleDeleteClick(e, activity)}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Supprimer cette activité"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-running-blue flex-shrink-0" />
                <span className="font-medium">{formatDistance(activity.distance)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-green-600 flex-shrink-0" />
                <span className="font-medium">{formatDuration(activity.moving_time)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>Allure: {formatPace(activity.distance, activity.moving_time)}</span>
              {activity.total_elevation_gain && (
                <>
                  <span>•</span>
                  <span>D+: {formatElevation(activity.total_elevation_gain)}</span>
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
