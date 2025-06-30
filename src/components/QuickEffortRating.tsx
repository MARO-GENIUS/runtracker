
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Save, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useActivities } from '@/hooks/useActivities';
import { useEffortRating } from '@/hooks/useEffortRating';
import { toast } from 'sonner';

interface QuickEffortRatingProps {
  onRatingUpdated?: () => void;
}

const QuickEffortRating = ({ onRatingUpdated }: QuickEffortRatingProps) => {
  const { activities, loading } = useActivities({ limit: 5, sortBy: 'start_date', sortOrder: 'desc' });
  const { updateEffortRating } = useEffortRating();
  const [ratings, setRatings] = useState<Record<number, { rating: number; notes: string }>>({});
  const [expandedActivity, setExpandedActivity] = useState<number | null>(null);

  const activitiesWithoutRating = activities.filter(activity => !activity.effort_rating);

  const handleRatingChange = (activityId: number, rating: number) => {
    setRatings(prev => ({
      ...prev,
      [activityId]: { ...prev[activityId], rating }
    }));
  };

  const handleNotesChange = (activityId: number, notes: string) => {
    setRatings(prev => ({
      ...prev,
      [activityId]: { ...prev[activityId], notes: notes || '' }
    }));
  };

  const handleSave = async (activityId: number) => {
    const rating = ratings[activityId];
    if (!rating) return;

    try {
      await updateEffortRating(activityId, rating.rating, rating.notes);
      toast.success('Ressenti sauvegardé');
      setExpandedActivity(null);
      if (onRatingUpdated) onRatingUpdated();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const getRatingLabel = (rating: number) => {
    const labels = {
      1: 'Très facile', 2: 'Facile', 3: 'Modéré', 4: 'Confortable', 5: 'Soutenu',
      6: 'Difficile', 7: 'Très difficile', 8: 'Intense', 9: 'Très intense', 10: 'Épuisant'
    };
    return labels[rating as keyof typeof labels] || 'Soutenu';
  };

  const getRatingColor = (rating: number) => {
    if (rating <= 3) return 'text-green-600 bg-green-50';
    if (rating <= 5) return 'text-yellow-600 bg-yellow-50';
    if (rating <= 7) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) return null;
  if (activitiesWithoutRating.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Ressenti des dernières courses
          <span className="text-sm font-normal text-gray-500">
            ({activitiesWithoutRating.length} sans ressenti)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activitiesWithoutRating.slice(0, 3).map((activity) => {
          const isExpanded = expandedActivity === activity.id;
          const currentRating = ratings[activity.id]?.rating || 5;
          const currentNotes = ratings[activity.id]?.notes || '';

          return (
            <div key={activity.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="font-medium truncate">{activity.name}</span>
                  <span className="text-sm text-gray-500">
                    {(activity.distance / 1000).toFixed(1)}km
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedActivity(isExpanded ? null : activity.id)}
                >
                  {isExpanded ? 'Réduire' : 'Ajouter ressenti'}
                </Button>
              </div>

              {isExpanded && (
                <div className="space-y-4 mt-4 pt-4 border-t">
                  <div className={`text-center p-3 rounded-lg ${getRatingColor(currentRating)}`}>
                    <div className="text-2xl font-bold">{currentRating}/10</div>
                    <div className="text-sm font-medium">{getRatingLabel(currentRating)}</div>
                  </div>

                  <div className="space-y-2">
                    <Slider
                      value={[currentRating]}
                      onValueChange={(values) => handleRatingChange(activity.id, values[0])}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>1 - Très facile</span>
                      <span>5 - Soutenu</span>
                      <span>10 - Épuisant</span>
                    </div>
                  </div>

                  <Textarea
                    placeholder="Notes sur votre ressenti (optionnel)"
                    value={currentNotes}
                    onChange={(e) => handleNotesChange(activity.id, e.target.value)}
                    className="min-h-[60px]"
                  />

                  <Button
                    onClick={() => handleSave(activity.id)}
                    className="w-full"
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder le ressenti
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default QuickEffortRating;
