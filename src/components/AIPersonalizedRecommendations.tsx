
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Heart, Target, Play, Brain, Utensils, Bed } from 'lucide-react';
import { AIRecommendation } from '@/hooks/useAICoach';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';

interface AIPersonalizedRecommendationsProps {
  recommendations: AIRecommendation[];
  onStartSession: (recommendation: AIRecommendation) => void;
  isLoading: boolean;
}

const AIPersonalizedRecommendations = ({ 
  recommendations, 
  onStartSession, 
  isLoading 
}: AIPersonalizedRecommendationsProps) => {
  const [expandedCards, setExpandedCards] = useState<number[]>([]);

  const toggleExpanded = (index: number) => {
    setExpandedCards(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

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

  if (isLoading) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <div className="text-gray-500 mb-4">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
            <p className="font-medium">Coach IA en cours d'analyse...</p>
            <p className="text-sm mt-2">Analyse de vos données Strava et génération de recommandations personnalisées</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <div className="text-gray-500 mb-4">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune recommandation IA disponible</p>
            <p className="text-sm mt-2">Utilisez le bouton "Analyser avec l'IA" pour générer des recommandations</p>
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
                <Brain className="h-4 w-4 text-blue-600" />
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

            {rec.targetPace && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-700">
                  🎯 Allure cible: <span className="text-blue-600">{rec.targetPace}</span>
                </p>
              </div>
            )}

            <Collapsible open={expandedCards.includes(index)} onOpenChange={() => toggleExpanded(index)}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between text-gray-600 hover:text-gray-800">
                  <span>Détails de la séance</span>
                  <span className="text-xs">{expandedCards.includes(index) ? '▼' : '▶'}</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="font-medium text-green-800 mb-1">🔥 Échauffement</p>
                    <p className="text-green-700">{rec.warmup}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium text-blue-800 mb-1">💪 Corps de séance</p>
                    <p className="text-blue-700">{rec.mainSet}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="font-medium text-purple-800 mb-1">😌 Retour au calme</p>
                    <p className="text-purple-700">{rec.cooldown}</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-lg">
                  <div className="flex items-start gap-2">
                    <Brain className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-yellow-800 text-sm">Analyse IA</p>
                      <p className="text-yellow-700 text-sm">{rec.aiJustification}</p>
                    </div>
                  </div>
                </div>

                {(rec.nutritionTips || rec.recoveryAdvice) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {rec.nutritionTips && (
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Utensils className="h-4 w-4 text-orange-600" />
                          <p className="font-medium text-orange-800">Nutrition</p>
                        </div>
                        <p className="text-orange-700">{rec.nutritionTips}</p>
                      </div>
                    )}
                    {rec.recoveryAdvice && (
                      <div className="bg-indigo-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Bed className="h-4 w-4 text-indigo-600" />
                          <p className="font-medium text-indigo-800">Récupération</p>
                        </div>
                        <p className="text-indigo-700">{rec.recoveryAdvice}</p>
                      </div>
                    )}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
            
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

export default AIPersonalizedRecommendations;
