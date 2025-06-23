
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActivityMetrics } from './ActivityMetrics';
import { BestEfforts } from './BestEfforts';
import { ActivitySplits } from './ActivitySplits';
import { HeartRateChart } from './HeartRateChart';
import { HeartRateTimeSeries } from './HeartRateTimeSeries';
import { EffortRating } from './EffortRating';
import { useEffortRating } from '@/hooks/useEffortRating';
import { formatDate, formatDateTime } from '@/utils/activityHelpers';

interface HeartRateDataPoint {
  time: number;
  heartRate: number;
  distance?: number;
}

interface ActivityDetailViewProps {
  activity: {
    id: number;
    name: string;
    type: string;
    distance: number;
    moving_time: number;
    elapsed_time: number;
    total_elevation_gain: number | null;
    start_date_local: string;
    location_city: string | null;
    location_state: string | null;
    location_country: string | null;
    average_speed: number | null;
    max_speed: number | null;
    average_heartrate: number | null;
    max_heartrate: number | null;
    suffer_score: number | null;
    calories: number | null;
    effort_rating?: number | null;
    effort_notes?: string | null;
    best_efforts?: any[];
    splits?: any[];
    heart_rate_stream?: HeartRateDataPoint[];
  };
}

export const ActivityDetailView: React.FC<ActivityDetailViewProps> = ({ activity }) => {
  const { updateEffortRating } = useEffortRating();

  console.log('ActivityDetailView received activity:', {
    id: activity.id,
    name: activity.name,
    effort_rating: activity.effort_rating,
    best_efforts_count: activity.best_efforts?.length || 0,
    splits_count: activity.splits?.length || 0,
    heart_rate_stream_count: activity.heart_rate_stream?.length || 0,
    average_heartrate: activity.average_heartrate
  });

  const handleEffortSave = async (rating: number, notes: string) => {
    await updateEffortRating(activity.id, rating, notes);
  };

  // Check if we have detailed heart rate data
  const hasDetailedHeartRate = activity.heart_rate_stream && activity.heart_rate_stream.length > 0;
  const hasAnyHeartRateData = activity.average_heartrate || hasDetailedHeartRate;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{activity.name}</h2>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <span>{formatDateTime(activity.start_date_local)}</span>
          {(activity.location_city || activity.location_state) && (
            <span>
              {[activity.location_city, activity.location_state, activity.location_country]
                .filter(Boolean)
                .join(', ')}
            </span>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="effort">Ressenti</TabsTrigger>
          <TabsTrigger value="charts">Graphiques</TabsTrigger>
          <TabsTrigger value="details">Détails</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ActivityMetrics activity={activity} />
          <BestEfforts bestEfforts={activity.best_efforts || []} />
        </TabsContent>

        <TabsContent value="effort" className="space-y-6">
          <EffortRating 
            activityId={activity.id}
            currentRating={activity.effort_rating}
            currentNotes={activity.effort_notes}
            onSave={handleEffortSave}
          />
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          {hasAnyHeartRateData ? (
            hasDetailedHeartRate ? (
              <HeartRateTimeSeries 
                heartRateData={activity.heart_rate_stream!}
                averageHR={activity.average_heartrate || 0}
                maxHR={activity.max_heartrate}
              />
            ) : (
              <HeartRateChart 
                averageHR={activity.average_heartrate!}
                maxHR={activity.max_heartrate}
              />
            )
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-600 mb-2">Aucune donnée de fréquence cardiaque disponible</p>
                <p className="text-sm text-gray-500">
                  Cette activité ne contient pas de données de fréquence cardiaque.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <ActivitySplits splits={activity.splits || []} />
          <Card>
            <CardHeader>
              <CardTitle>Informations techniques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Type d'activité:</span>
                  <span className="ml-2 font-medium">{activity.type}</span>
                </div>
                {activity.suffer_score && (
                  <div>
                    <span className="text-gray-600">Score de difficulté:</span>
                    <span className="ml-2 font-medium">{activity.suffer_score}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Temps en mouvement:</span>
                  <span className="ml-2 font-medium">{Math.round(activity.moving_time / 60)} min</span>
                </div>
                <div>
                  <span className="text-gray-600">Temps total:</span>
                  <span className="ml-2 font-medium">{Math.round(activity.elapsed_time / 60)} min</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
