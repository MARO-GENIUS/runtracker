
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, MapPin, Activity, Zap } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ActivityData {
  id: number;
  name: string;
  distance: number; // in meters
  moving_time: number; // in seconds
  average_speed: number | null;
  start_date_local: string;
}

interface ActivityPopoverProps {
  activities: ActivityData[];
  date: string;
  children: React.ReactNode;
}

const ActivityPopover = ({ activities, date, children }: ActivityPopoverProps) => {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatPace = (averageSpeed: number | null): string => {
    if (!averageSpeed) return 'N/A';
    // Convert m/s to min/km
    const paceInMinutesPerKm = 1000 / (averageSpeed * 60);
    const minutes = Math.floor(paceInMinutesPerKm);
    const seconds = Math.round((paceInMinutesPerKm - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  };

  const totalDistance = activities.reduce((sum, activity) => sum + activity.distance, 0) / 1000;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="center">
        <div className="space-y-3">
          <div className="border-b pb-2">
            <h3 className="font-semibold text-gray-900">
              {format(new Date(date), 'EEEE d MMMM yyyy', { locale: fr })}
            </h3>
            <p className="text-sm text-gray-600">
              {activities.length} course{activities.length > 1 ? 's' : ''} • {totalDistance.toFixed(1)} km total
            </p>
          </div>
          
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div key={activity.id} className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Activity size={16} className="text-running-blue" />
                  {activity.name}
                </h4>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin size={14} />
                    <span>{(activity.distance / 1000).toFixed(1)} km</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock size={14} />
                    <span>{formatTime(activity.moving_time)}</span>
                  </div>
                  
                  {activity.average_speed && (
                    <div className="flex items-center gap-1 text-gray-600 col-span-2">
                      <Zap size={14} />
                      <span>{formatPace(activity.average_speed)}</span>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 mt-2">
                  {format(new Date(activity.start_date_local), 'HH:mm', { locale: fr })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ActivityPopover;
