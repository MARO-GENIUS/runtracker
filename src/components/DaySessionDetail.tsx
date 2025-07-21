
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Activity, Brain, Clock, MapPin, Heart, Zap, Calendar, Settings } from 'lucide-react';
import SessionTypeSelector from './SessionTypeSelector';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { WorkoutDetailModal } from './workout-forms/WorkoutDetailModal';

interface WeeklyActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  start_date_local: string;
  average_speed: number | null;
  effort_rating: number | null;
  effort_notes: string | null;
  session_type?: string | null;
}

interface AIRecommendation {
  id: string;
  recommendation_data: any;
  generated_at: string;
  status: string;
  matching_activity_id: number | null;
}

interface DaySessionDetailProps {
  date: Date;
  activities: WeeklyActivity[];
  recommendations: AIRecommendation[];
  onClose: () => void;
  onActivityUpdate?: () => void;
}

export const DaySessionDetail: React.FC<DaySessionDetailProps> = ({
  date,
  activities,
  recommendations,
  onClose,
  onActivityUpdate
}) => {
  const { user } = useAuth();
  const [workoutModalOpen, setWorkoutModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<WeeklyActivity | null>(null);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h${minutes.toString().padStart(2, '0')}` : `${minutes} min`;
  };

  const formatDistance = (meters: number) => {
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatPace = (distance: number, time: number) => {
    if (distance === 0) return 'N/A';
    const paceSeconds = time / (distance / 1000);
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.round(paceSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
  };

  const handleSessionTypeChange = async (activityId: number, newType: string) => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      // Mettre à jour le type de session dans la base de données avec la nouvelle colonne
      const { error } = await supabase
        .from('strava_activities')
        .update({ session_type: newType })
        .eq('id', activityId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }

      // Notifier le parent pour rafraîchir les données
      if (onActivityUpdate) {
        onActivityUpdate();
      }

      console.log('Type de séance mis à jour avec succès pour l\'activité:', activityId);
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du type de séance:', error);
      throw error;
    }
  };

  const getRecommendationType = (recData: any) => {
    const type = recData?.type || 'unknown';
    const typeLabels = {
      'endurance': 'Endurance fondamentale',
      'tempo': 'Séance tempo',
      'intervals': 'Fractionné',
      'recovery': 'Récupération active',
      'long': 'Sortie longue'
    };
    return typeLabels[type as keyof typeof typeLabels] || 'Séance personnalisée';
  };

  const getEffortRatingColor = (rating: number | null) => {
    if (!rating) return 'bg-gray-100 text-gray-600';
    if (rating <= 3) return 'bg-green-100 text-green-800';
    if (rating <= 6) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const handleWorkoutDetailClick = (activity: WeeklyActivity) => {
    setSelectedActivity(activity);
    setWorkoutModalOpen(true);
  };

  const handleWorkoutModalClose = () => {
    setWorkoutModalOpen(false);
    setSelectedActivity(null);
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          {formatDate(date)}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Séances réalisées */}
        {activities.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-800">
                Séance{activities.length > 1 ? 's' : ''} réalisée{activities.length > 1 ? 's' : ''}
              </h3>
            </div>

            {activities.map((activity) => (
              <div
                key={activity.id}
                className="bg-green-50 border border-green-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-green-900">{activity.name}</h4>
                  <div className="flex items-center gap-2">
                    {activity.effort_rating && (
                      <Badge className={`text-xs ${getEffortRatingColor(activity.effort_rating)}`}>
                        Effort: {activity.effort_rating}/10
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleWorkoutDetailClick(activity)}
                      className="h-7 px-2"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Détailler
                    </Button>
                  </div>
                </div>

                {/* Sélecteur de type de séance pour cette activité */}
                <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-blue-800">Type de séance:</span>
                  </div>
                  <SessionTypeSelector
                    activityId={activity.id}
                    currentType={activity.session_type}
                    onTypeChange={handleSessionTypeChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span>{formatDistance(activity.distance)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span>{formatDuration(activity.moving_time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-600" />
                    <span>{formatPace(activity.distance, activity.moving_time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-green-600" />
                    <span>
                      {new Date(activity.start_date_local).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {activity.effort_notes && (
                  <div className="mt-3 p-2 bg-green-100 rounded text-sm">
                    <span className="font-medium">Notes: </span>
                    {activity.effort_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Recommandations IA */}
        {recommendations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-purple-800">
                Recommandation{recommendations.length > 1 ? 's' : ''} IA
              </h3>
            </div>

            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="bg-purple-50 border border-purple-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-purple-900">
                    {getRecommendationType(rec.recommendation_data)}
                  </h4>
                  <Badge 
                    variant={rec.status === 'completed' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {rec.status === 'completed' ? 'Réalisée' : 'Planifiée'}
                  </Badge>
                </div>

                {rec.recommendation_data && (
                  <div className="space-y-2 text-sm text-purple-800">
                    {rec.recommendation_data.duration && (
                      <div>
                        <span className="font-medium">Durée: </span>
                        {rec.recommendation_data.duration} min
                      </div>
                    )}
                    {rec.recommendation_data.targetPace && (
                      <div>
                        <span className="font-medium">Allure cible: </span>
                        {rec.recommendation_data.targetPace}
                      </div>
                    )}
                    {rec.recommendation_data.description && (
                      <div className="mt-2 p-2 bg-purple-100 rounded">
                        {rec.recommendation_data.description}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Message si aucune donnée */}
        {activities.length === 0 && recommendations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucune séance enregistrée pour ce jour</p>
          </div>
        )}
      </CardContent>

      {/* Modal pour les détails d'entraînement */}
      {selectedActivity && (
        <WorkoutDetailModal
          isOpen={workoutModalOpen}
          onClose={handleWorkoutModalClose}
          activityId={selectedActivity.id}
          activityName={selectedActivity.name}
          sessionType={selectedActivity.session_type}
        />
      )}
    </Card>
  );
};
