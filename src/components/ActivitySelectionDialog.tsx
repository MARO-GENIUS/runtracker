
import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Calendar, Clock, MapPin, Zap } from 'lucide-react';
import { AIRecommendation } from '@/hooks/useAICoach';

interface Activity {
  id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  start_date_local: string;
  average_speed?: number;
  location_city?: string;
  location_state?: string;
}

interface ActivitySelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (activityId: number) => void;
  activities: Activity[];
  recommendation: AIRecommendation;
  isLoading?: boolean;
}

const ActivitySelectionDialog: React.FC<ActivitySelectionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  activities,
  recommendation,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);

  // Filter and sort activities
  const filteredActivities = useMemo(() => {
    let filtered = activities.filter(activity => {
      // Filter by running activities only
      if (activity.type !== 'Run') return false;
      
      // Search filter
      if (searchTerm && !activity.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });

    // Sort by date (most recent first)
    return filtered.sort((a, b) => 
      new Date(b.start_date_local).getTime() - new Date(a.start_date_local).getTime()
    );
  }, [activities, searchTerm]);

  const formatDistance = (distance: number) => {
    return (distance / 1000).toFixed(1) + ' km';
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const formatPace = (speed: number) => {
    if (!speed) return '';
    const paceSeconds = 1000 / speed;
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.floor(paceSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  };

  const getCompatibilityScore = (activity: Activity) => {
    const activityDistance = activity.distance / 1000;
    const activityDuration = activity.moving_time / 60;
    
    // Simple compatibility scoring based on type and duration
    let score = 0;
    
    // Duration compatibility
    const durationDiff = Math.abs(activityDuration - recommendation.duration);
    if (durationDiff < 10) score += 3;
    else if (durationDiff < 20) score += 2;
    else if (durationDiff < 30) score += 1;
    
    // Type compatibility
    if (recommendation.type === 'endurance' && activityDistance > 8) score += 2;
    if (recommendation.type === 'intervals' && activityDistance < 8) score += 2;
    if (recommendation.type === 'long' && activityDistance > 15) score += 2;
    if (recommendation.type === 'recovery' && activityDistance < 5) score += 2;
    
    return score;
  };

  const handleConfirm = () => {
    if (selectedActivityId) {
      onConfirm(selectedActivityId);
      setSelectedActivityId(null);
      setSearchTerm('');
    }
  };

  const handleClose = () => {
    setSelectedActivityId(null);
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Associer une activité
          </DialogTitle>
          <DialogDescription>
            Sélectionnez l'activité Strava qui correspond à votre séance "{recommendation.title}"
          </DialogDescription>
        </DialogHeader>

        {/* Recommendation summary */}
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-800">{recommendation.title}</h4>
                <p className="text-sm text-blue-600">
                  {recommendation.duration} min • {recommendation.type} • {recommendation.intensity}
                </p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                {recommendation.type.charAt(0).toUpperCase() + recommendation.type.slice(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher une activité..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Activities list */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-2 pr-4">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune activité de course trouvée</p>
                <p className="text-sm mt-2">Essayez de synchroniser vos activités Strava</p>
              </div>
            ) : (
              filteredActivities.map((activity) => {
                const compatibility = getCompatibilityScore(activity);
                const isSelected = selectedActivityId === activity.id;
                
                return (
                  <Card
                    key={activity.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected 
                        ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' 
                        : compatibility >= 3 
                        ? 'border-green-200 bg-green-50/30' 
                        : ''
                    }`}
                    onClick={() => setSelectedActivityId(activity.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900">{activity.name}</h4>
                            {compatibility >= 3 && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                Compatible
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{formatDistance(activity.distance)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDuration(activity.moving_time)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(activity.start_date_local).toLocaleDateString()}</span>
                            </div>
                            {activity.average_speed && (
                              <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                <span>{formatPace(activity.average_speed)}</span>
                              </div>
                            )}
                          </div>
                          
                          {(activity.location_city || activity.location_state) && (
                            <p className="text-xs text-gray-500 mt-2">
                              {[activity.location_city, activity.location_state].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedActivityId || isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Association...
              </div>
            ) : (
              'Associer cette activité'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ActivitySelectionDialog;
