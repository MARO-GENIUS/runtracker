
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

interface SelectedActivitySummaryProps {
  activity: Activity;
}

const SelectedActivitySummary = ({ activity }: SelectedActivitySummaryProps) => {
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
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex-shrink-0">
      <h4 className="font-medium text-green-900 mb-2">Activité sélectionnée :</h4>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{activity.name}</p>
          <p className="text-sm text-green-700">
            {formatDistance(activity.distance)} • {formatDuration(activity.moving_time)} • {formatDate(activity.start_date_local)}
          </p>
        </div>
        <Badge className={getTypeColor(activity.type)}>
          {activity.type}
        </Badge>
      </div>
    </div>
  );
};

export default SelectedActivitySummary;
