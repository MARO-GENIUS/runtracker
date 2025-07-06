
import ActivityListItem from './ActivityListItem';

interface Activity {
  id: number;
  name: string;
  distance: number;
  start_date_local: string;
  type: string;
  location_city?: string;
  moving_time: number;
}

interface ActivityListProps {
  activities: Activity[];
  selectedActivityId: number | null;
  onActivityClick: (activityId: number) => void;
}

const ActivityList = ({ activities, selectedActivityId, onActivityClick }: ActivityListProps) => {
  if (activities.length === 0) {
    return (
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="text-center py-8 text-gray-500">
          Aucune activité trouvée.
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <div className="h-full overflow-y-auto space-y-2 pr-2">
        {activities.map((activity) => (
          <ActivityListItem
            key={activity.id}
            activity={activity}
            isSelected={selectedActivityId === activity.id}
            onClick={onActivityClick}
          />
        ))}
      </div>
    </div>
  );
};

export default ActivityList;
