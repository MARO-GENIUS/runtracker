
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Target, Calendar } from 'lucide-react';
import { AIRecommendation } from '@/hooks/useAICoach';

interface PersistentRecommendation {
  id: string;
  recommendation_data: AIRecommendation;
  generated_at: string;
  completed_at?: string;
  matching_activity_id?: number;
  status: 'pending' | 'completed' | 'expired';
}

interface PersistentAIRecommendationsProps {
  recommendations: PersistentRecommendation[];
  isLoading: boolean;
}

const PersistentAIRecommendations = ({ recommendations, isLoading }: PersistentAIRecommendationsProps) => {
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

  const getStatusBadge = (status: string, completedAt?: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Réalisée
            {completedAt && (
              <span className="text-xs ml-1">
                ({new Date(completedAt).toLocaleDateString()})
              </span>
            )}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            En attente
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-gray-100 text-gray-800">
            Expirée
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Chargement des recommandations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucune recommandation IA sauvegardée</p>
          <p className="text-sm mt-2">Utilisez le bouton "Analyser avec l'IA" pour générer des recommandations</p>
        </CardContent>
      </Card>
    );
  }

  const completedCount = recommendations.filter(r => r.status === 'completed').length;
  const totalCount = recommendations.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Statistiques de suivi */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Suivi des recommandations</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{completionRate}%</div>
              <div className="text-sm text-gray-600">{completedCount}/{totalCount} réalisées</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des recommandations */}
      {recommendations.map((persistentRec) => {
        const rec = persistentRec.recommendation_data;
        const isCompleted = persistentRec.status === 'completed';
        
        return (
          <Card 
            key={persistentRec.id} 
            className={`transition-all ${
              isCompleted 
                ? 'border-green-200 bg-green-50/30' 
                : 'hover:shadow-md'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {rec.title}
                  </CardTitle>
                  {isCompleted && <CheckCircle className="h-5 w-5 text-green-600" />}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getTypeColor(rec.type)}>
                    {rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}
                  </Badge>
                  {getStatusBadge(persistentRec.status, persistentRec.completed_at)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <p className="text-gray-600 leading-relaxed">
                {rec.description}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{rec.duration} min</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">
                    Générée le {new Date(persistentRec.generated_at).toLocaleDateString()}
                  </span>
                </div>
                
                {rec.targetPace && (
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-400" />
                    <span className="font-medium">{rec.targetPace}</span>
                  </div>
                )}
              </div>

              {isCompleted && persistentRec.matching_activity_id && (
                <div className="bg-green-100 border border-green-200 rounded-lg p-3 mt-3">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium text-sm">
                      Séance réalisée le {new Date(persistentRec.completed_at!).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    Correspondance détectée automatiquement avec votre activité Strava
                  </p>
                </div>
              )}

              <div className="text-xs text-gray-500 mt-2">
                Intensité: {rec.intensity} • Priorité: {rec.priority}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default PersistentAIRecommendations;
