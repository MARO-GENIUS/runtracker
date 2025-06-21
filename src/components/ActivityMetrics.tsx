
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, TrendingUp, Activity, Heart, Flame } from 'lucide-react';
import { formatDistance, formatDuration, formatPace, formatElevation } from '@/utils/activityHelpers';

interface ActivityMetricsProps {
  activity: {
    distance: number;
    moving_time: number;
    total_elevation_gain: number | null;
    average_heartrate: number | null;
    max_heartrate: number | null;
    calories: number | null;
  };
}

export const ActivityMetrics: React.FC<ActivityMetricsProps> = ({ activity }) => {
  const metrics = [
    {
      icon: TrendingUp,
      label: 'Distance',
      value: formatDistance(activity.distance),
      color: 'text-running-blue'
    },
    {
      icon: Clock,
      label: 'Temps',
      value: formatDuration(activity.moving_time),
      color: 'text-green-600'
    },
    {
      icon: Activity,
      label: 'Allure moyenne',
      value: formatPace(activity.distance, activity.moving_time),
      color: 'text-purple-600'
    },
    {
      icon: TrendingUp,
      label: 'Dénivelé',
      value: formatElevation(activity.total_elevation_gain),
      color: 'text-orange-600'
    }
  ];

  // Add heart rate if available
  if (activity.average_heartrate) {
    metrics.push({
      icon: Heart,
      label: 'FC moyenne',
      value: `${Math.round(activity.average_heartrate)} bpm`,
      color: 'text-red-500'
    });
  }

  if (activity.max_heartrate) {
    metrics.push({
      icon: Heart,
      label: 'FC max',
      value: `${Math.round(activity.max_heartrate)} bpm`,
      color: 'text-red-600'
    });
  }

  // Add calories if available
  if (activity.calories) {
    metrics.push({
      icon: Flame,
      label: 'Calories',
      value: `${activity.calories} kcal`,
      color: 'text-yellow-600'
    });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gray-100 ${metric.color}`}>
                <metric.icon size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{metric.label}</p>
                <p className="text-lg font-semibold text-gray-800">{metric.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
