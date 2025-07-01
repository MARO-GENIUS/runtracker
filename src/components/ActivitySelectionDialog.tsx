
import { useState } from 'react';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Calendar, MapPin, Clock, Target, CheckCircle } from 'lucide-react';
import { AIRecommendation } from '@/hooks/useAICoach';

interface Activity {
  id: number;
  name: string;
  distance: number;
  start_date_local: string;
  type: string;
  location_city?: string;
  moving_time: number;
}

interface ActivitySelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (activityId: number) => void;
  activities: Activity[];
  recommendation: AIRecommendation;
  isLoading?: boolean;
}

const ActivitySelectionDialog = ({
  isOpen,
  onClose,
  onConfirm,
  activities,
  recommendation,
  isLoading = false
}: ActivitySelectionDialogProps) => {
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Protection contre recommendation undefined
  if (!recommendation || !recommendation.type) {
    return null;
  }

  const selectedActivity = activities.find(a => a.id === selectedActivityId);

  const filteredActivities = activities.filter(activity =>
    activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (activity.location_city && activity.location_city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  const getRecommendationTypeColor = (type: string) => {
    switch (type) {
      case 'endurance': return 'bg-blue-100 text-blue-800';
      case 'tempo': return 'bg-orange-100 text-orange-800';
      case 'intervals': return 'bg-red-100 text-red-800';
      case 'recovery': return 'bg-green-100 text-green-800';
      case 'long': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleConfirm = () => {
    if (selectedActivityId) {
      onConfirm(selectedActivityId);
    }
  };

  const handleClose = () => {
    setSelectedActivityId(null);
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Associer une activité à la recommandation
          </DialogTitle>
          <DialogDescription>
            Sélectionnez une activité Strava qui correspond à cette recommandation IA
          </DialogDescription>
        </DialogHeader>

        {/* Recommendation Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-blue-900">{recommendation.title}</h3>
            <Badge className={getRecommendationTypeColor(recommendation.type)}>
              {recommendation.type.charAt(0).toUpperCase() + recommendation.type.slice(1)}
            </Badge>
          </div>
          <p className="text-blue-800 text-sm mb-2">{recommendation.description}</p>
          <div className="flex items-center gap-4 text-sm text-blue-700">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{recommendation.duration} minutes</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span>{recommendation.intensity}</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <Input
            placeholder="Rechercher par nom, type d'activité ou lieu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Activities List */}
        <div className="flex-1 min-h-0">
          <Command className="h-full">
            <CommandList className="max-h-[400px]">
              <CommandEmpty>Aucune activité trouvée.</CommandEmpty>
              <CommandGroup>
                {filteredActivities.map((activity) => (
                  <CommandItem
                    key={activity.id}
                    value={activity.id.toString()}
                    onSelect={() => setSelectedActivityId(activity.id)}
                    className={`p-4 cursor-pointer border rounded-lg mb-2 ${
                      selectedActivityId === activity.id
                        ? 'bg-blue-50 border-blue-300'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{activity.name}</h4>
                          <Badge className={getTypeColor(activity.type)}>
                            {activity.type}
                          </Badge>
                          {selectedActivityId === activity.id && (
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
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>

        {/* Selected Activity Details */}
        {selectedActivity && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <h4 className="font-medium text-green-900 mb-2">Activité sélectionnée :</h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{selectedActivity.name}</p>
                <p className="text-sm text-green-700">
                  {formatDistance(selectedActivity.distance)} • {formatDuration(selectedActivity.moving_time)} • {formatDate(selectedActivity.start_date_local)}
                </p>
              </div>
              <Badge className={getTypeColor(selectedActivity.type)}>
                {selectedActivity.type}
              </Badge>
            </div>
          </div>
        )}

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedActivityId || isLoading}
          >
            {isLoading ? 'Association...' : 'Confirmer l\'association'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ActivitySelectionDialog;
