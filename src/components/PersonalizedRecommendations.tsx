
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Heart, Target, Play } from 'lucide-react';

interface TrainingRecommendation {
  type: 'endurance' | 'tempo' | 'intervals' | 'recovery' | 'long';
  title: string;
  description: string;
  duration: number;
  intensity: string;
  targetHR?: { min: number; max: number };
  scheduledFor: 'today' | 'tomorrow' | 'this-week';
  priority: 'high' | 'medium' | 'low';
}

interface PersonalizedRecommendationsProps {
  recommendations: TrainingRecommendation[];
  onStartSession: (recommendation: TrainingRecommendation) => void;
}

const PersonalizedRecommendations = ({ recommendations, onStartSession }: PersonalizedRecommendationsProps) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'endurance': return 'bg-blue-100 text-blue-800';
      case 'tempo': return 'bg-orange-100 text-orange-800';
      case 'intervals': return 'bg-red-100 text-red-800';
      case 'recovery': return 'bg-green-100 text-green-800';
      case 'long': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScheduleText = (scheduledFor: string) => {
    switch (scheduledFor) {
      case 'today': return 'Aujourd\'hui';
      case 'tomorrow': return 'Demain';
      case 'this-week': return 'Cette semaine';
      default: return '';
    }
  };

  const getPriorityIcon = (priority: string) => {
    return priority === 'high' ? <Target className="h-4 w-4 text-red-500" /> : null;
  };

  if (recommendations.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <div className="text-gray-500 mb-4">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Analyse de vos données en cours...</p>
            <p className="text-sm mt-2">Les recommandations apparaîtront bientôt</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec, index) => (
        <Card key={index} className={`${rec.priority === 'high' ? 'ring-2 ring-blue-200 bg-blue-50/30' : 'hover:shadow-md'} transition-all`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getPriorityIcon(rec.priority)}
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {rec.title}
                </CardTitle>
              </div>
              <Badge className={getTypeColor(rec.type)}>
                {rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-gray-600 leading-relaxed">
              {rec.description}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{rec.duration} min</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{getScheduleText(rec.scheduledFor)}</span>
              </div>
              
              {rec.targetHR && (
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-400" />
                  <span className="font-medium">{rec.targetHR.min}-{rec.targetHR.max} bpm</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button 
                onClick={() => onStartSession(rec)}
                className="flex-1"
                variant={rec.priority === 'high' ? 'default' : 'outline'}
              >
                <Play className="h-4 w-4 mr-2" />
                Planifier cette séance
              </Button>
              
              <div className="flex items-center text-sm text-gray-500 px-3">
                Intensité: <span className="font-medium ml-1">{rec.intensity}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PersonalizedRecommendations;
