import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActivityMetrics } from './ActivityMetrics';
import { BestEfforts } from './BestEfforts';
import { ActivitySplits } from './ActivitySplits';
import { HeartRateChart } from './HeartRateChart';
import { HeartRateTimeSeries } from './HeartRateTimeSeries';
import { EffortRating } from './EffortRating';
import { NextSessionSuggestion } from './NextSessionSuggestion';
import { ActivityMap } from './ActivityMap';
import { useEffortRating } from '@/hooks/useEffortRating';
import { formatDate, formatDateTime } from '@/utils/activityHelpers';
import { TruncatedText } from '@/components/ui/truncated-text';
import { Eye, Map, Heart, BarChart3, Info, Brain } from 'lucide-react';

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
    // Map data
    map_polyline?: string | null;
    map_summary_polyline?: string | null;
    start_latlng?: string | null;
    end_latlng?: string | null;
  };
}

export const ActivityDetailView: React.FC<ActivityDetailViewProps> = ({ activity }) => {
  const { updateEffortRating } = useEffortRating();

  const handleEffortSave = async (rating: number, notes: string) => {
    await updateEffortRating(activity.id, rating, notes);
  };

  // Enhanced heart rate data detection
  const hasDetailedHeartRate = activity.heart_rate_stream && activity.heart_rate_stream.length > 0;
  const hasBasicHeartRate = activity.average_heartrate && activity.average_heartrate > 0;
  const hasAnyHeartRateData = hasDetailedHeartRate || hasBasicHeartRate;

  console.log('Heart rate data check:', {
    hasDetailedHeartRate,
    hasBasicHeartRate,
    hasAnyHeartRateData,
    averageHR: activity.average_heartrate,
    maxHR: activity.max_heartrate,
    streamLength: activity.heart_rate_stream?.length || 0
  });

  // Check if we have GPS data for map
  const hasGpsData = activity.map_polyline || activity.map_summary_polyline || 
                     (activity.start_latlng && activity.end_latlng);

  // Heart Rate Chart Component
  const HeartRateSection = () => {
    if (!hasAnyHeartRateData) {
      return (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">
                <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Données de fréquence cardiaque non disponibles pour cette séance
              </h3>
              <p className="text-sm text-gray-500">
                Assurez-vous que votre montre ou capteur était connecté pendant l'entraînement.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="p-6">
          <HeartRateTimeSeries 
            heartRateData={activity.heart_rate_stream || []}
            averageHR={activity.average_heartrate || 0}
            maxHR={activity.max_heartrate}
          />
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          <TruncatedText 
            text={activity.name}
            maxLength={40}
            useFallbackAt={20}
            fallbackIcon={<Eye size={20} className="text-running-blue" />}
            className="inline-block"
          />
        </h2>
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
        <TabsList className="grid w-full grid-cols-6 mobile-adaptive-container">
          <TabsTrigger value="overview" className="mobile-text-responsive-sm mobile-touch-target-sm">
            <span className="hidden sm:inline">Vue d'ensemble</span>
            <TruncatedText
              text="Vue d'ensemble"
              maxLength={8}
              useFallbackAt={6}
              fallbackIcon={<Eye size={14} />}
              className="sm:hidden mobile-text-responsive"
              showTooltip={true}
            />
          </TabsTrigger>
          <TabsTrigger value="map" className="mobile-text-responsive-sm mobile-touch-target-sm">
            <span className="hidden sm:inline">Parcours</span>
            <TruncatedText
              text="Parcours"
              maxLength={8}
              useFallbackAt={6}
              fallbackIcon={<Map size={14} />}
              className="sm:hidden mobile-text-responsive"
              showTooltip={true}
            />
          </TabsTrigger>
          <TabsTrigger value="effort" className="mobile-text-responsive-sm mobile-touch-target-sm">
            <span className="hidden sm:inline">Ressenti</span>
            <TruncatedText
              text="Ressenti"
              maxLength={8}
              useFallbackAt={6}
              fallbackIcon={<Heart size={14} />}
              className="sm:hidden mobile-text-responsive"
              showTooltip={true}
            />
          </TabsTrigger>
          <TabsTrigger value="charts" className="mobile-text-responsive-sm mobile-touch-target-sm">
            <span className="hidden sm:inline">Graphiques</span>
            <TruncatedText
              text="Graphiques"
              maxLength={8}
              useFallbackAt={6}
              fallbackIcon={<BarChart3 size={14} />}
              className="sm:hidden mobile-text-responsive"
              showTooltip={true}
            />
          </TabsTrigger>
          <TabsTrigger value="details" className="mobile-text-responsive-sm mobile-touch-target-sm">
            <span className="hidden sm:inline">Détails</span>
            <TruncatedText
              text="Détails"
              maxLength={8}
              useFallbackAt={6}
              fallbackIcon={<Info size={14} />}
              className="sm:hidden mobile-text-responsive"
              showTooltip={true}
            />
          </TabsTrigger>
          <TabsTrigger value="ai-analysis" className="mobile-text-responsive-sm mobile-touch-target-sm">
            <span className="hidden sm:inline">Prochaine séance</span>
            <TruncatedText
              text="Prochaine séance"
              maxLength={8}
              useFallbackAt={6}
              fallbackIcon={<Brain size={14} />}
              className="sm:hidden mobile-text-responsive"
              showTooltip={true}
            />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ActivityMetrics activity={activity} />
          
          {/* Heart Rate Section - Always visible in overview */}
          <HeartRateSection />
          
          {/* Compact map in overview */}
          {hasGpsData && (
            <ActivityMap
              polyline={activity.map_summary_polyline || activity.map_polyline}
              startLatLng={activity.start_latlng}
              endLatLng={activity.end_latlng}
              activityName={activity.name}
              compact={true}
            />
          )}
          
          <BestEfforts bestEfforts={activity.best_efforts || []} />
        </TabsContent>

        <TabsContent value="map" className="space-y-6">
          {hasGpsData ? (
            <ActivityMap
              polyline={activity.map_polyline || activity.map_summary_polyline}
              startLatLng={activity.start_latlng}
              endLatLng={activity.end_latlng}
              activityName={activity.name}
              compact={false}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-600 mb-2">Données GPS non disponibles</p>
                <p className="text-sm text-gray-500">
                  Cette activité ne contient pas de données de géolocalisation.
                </p>
              </CardContent>
            </Card>
          )}
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
          {/* Heart Rate Chart - Always visible in charts tab */}
          <HeartRateSection />
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

        <TabsContent value="ai-analysis" className="space-y-6">
          <NextSessionSuggestion activityId={activity.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
