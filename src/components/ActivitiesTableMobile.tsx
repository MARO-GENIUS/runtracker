
import React from 'react';
import { TrendingUp, Clock } from 'lucide-react';
import { formatDistance, formatDuration, formatPace, formatDate, formatElevation } from '@/utils/activityHelpers';

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
}

export const ActivitiesTableMobile: React.FC<ActivitiesTableMobileProps> = ({
  activities,
  onActivityClick
}) => {
  return (
    <div className="md:hidden">
      {activities.map((activity) => (
        <div 
          key={activity.id} 
          className="p-4 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => onActivityClick(activity.id)}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-800 text-sm">{activity.name}</h3>
            <span className="text-xs text-gray-500">{formatDate(activity.start_date_local)}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-running-blue" />
              <span>{formatDistance(activity.distance)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-green-600" />
              <span>{formatDuration(activity.moving_time)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
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
  );
};
