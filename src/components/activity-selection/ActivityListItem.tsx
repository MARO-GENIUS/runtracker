
import { Calendar, MapPin, Clock, Target, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Activity {
  id: number;
  name: string;
  distance: number;
  start_date_local: string;
  type: string;
  location_city?: string;
  moving_time: number;
}

interface ActivityListItemProps {
  activity: Activity;
  isSelected: boolean;
  onClick: (activityId: number) => void;
}

const ActivityListItem = ({ activity, isSelected, onClick }: ActivityListItemProps) => {
  const formatDistance = (distance: number) => {
    return `${(distance / 1000).toFixed(2)} km`;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h${remainingMinutes.toString().padStart(2, '0')}`;
    }
    return `${minutes} min`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'run':
        return 'bg-red-100 text-red-800';
      case 'ride':
        return 'bg-blue-100 text-blue-800';
      case 'walk':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      onClick={() => onClick(activity.id)}
      className={`p-4 cursor-pointer border rounded-lg transition-colors hover:shadow-md ${
        isSelected
          ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
          : 'hover:bg-gray-50 border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium">{activity.name}</h4>
            <Badge className={getTypeColor(activity.type)}>
              {activity.type}
            </Badge>
            {isSelected && (
              <CheckCircle className="h-4 w-4 text-blue-600" />
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              <span>{formatDistance(activity.distance)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDuration(activity.moving_time)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(activity.start_date_local)}</span>
            </div>
            {activity.location_city && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{activity.location_city}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityListItem;
