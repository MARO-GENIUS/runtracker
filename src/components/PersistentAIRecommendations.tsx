import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Target, Calendar, Heart, Brain, Utensils, Bed, Trash2, Link, Unlink } from 'lucide-react';
import { AIRecommendation } from '@/hooks/useAICoach';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import ActivitySelectionDialog from './ActivitySelectionDialog';
import { useActivities } from '@/hooks/useActivities';
import { useManualActivityAssociation } from '@/hooks/useManualActivityAssociation';

interface PersistentRecommendation {
  id: string;
  recommendation_data: AIRecommendation;
  generated_at: string;
  completed_at?: string;
  matching_activity_id?: number;
  status: 'pending' | 'completed' | 'expired';
  is_manual_match?: boolean;
}

interface PersistentAIRecommendationsProps {
  recommendations: PersistentRecommendation[];
  isLoading: boolean;
  onRemoveRecommendation?: (id: string) => void;
}

const PersistentAIRecommendations = ({ recommendations, isLoading, onRemoveRecommendation }: PersistentAIRecommendationsProps) => {
  const [expandedCards, setExpandedCards] = useState<number[]>([]);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<PersistentRecommendation | null>(null);
  
  // Get activities for association
  const { activities } = useActivities({ limit: 100 }); // Get more activities for better selection
  const { 
    associateActivityToRecommendation, 
    dissociateActivityFromRecommendation, 
    isAssociating 
  } = useManualActivityAssociation();

  const toggleExpanded = (index: number) => {
    setExpandedCards(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleAssociateClick = (rec: PersistentRecommendation) => {
    setSelectedRecommendation(rec);
    setActivityDialogOpen(true);
  };

  const handleActivityAssociation = async (activityId: number) => {
    if (!selectedRecommendation) return;
    
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;

    const success = await associateActivityToRecommendation(
      selectedRecommendation.id,
      activityId,
      activity.name,
      selectedRecommendation.recommendation_data.title
    );

    if (success) {
      setActivityDialogOpen(false);
      setSelectedRecommendation(null);
      // The parent component should refetch recommendations
      window.location.reload(); // Simple refresh for now
    }
  };

  const handleDissociation = async (rec: PersistentRecommendation) => {
    const success = await dissociateActivityFromRecommendation(
      rec.id,
      rec.recommendation_data.title
    );

    if (success) {
      window.location.reload(); // Simple refresh for now
    }
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

  const getStatusBadge = (status: string, completedAt?: string, isManualMatch?: boolean) => {
    switch (status) {
      case 'completed':
        return (
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Réalisée
              {completedAt && (
                <span className="text-xs ml-1">
                  ({new Date(completedAt).toLocaleDateString()})
                </span>
              )}
            </Badge>
            {isManualMatch && (
              <Badge variant="outline" className="text-xs border-blue-200 text-blue-600">
                Association manuelle
              </Badge>
            )}
          </div>
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

      {/* Liste des recommandations avec tous les détails */}
      {recommendations.map((persistentRec, index) => {
        const rec = persistentRec.recommendation_data;
        const isCompleted = persistentRec.status === 'completed';
        const isPending = persistentRec.status === 'pending';
        
        return (
          <Card 
            key={persistentRec.id} 
            className={`${
              isCompleted 
                ? 'border-green-200 bg-green-50/30' 
                : rec.priority === 'high' 
                ? 'ring-2 ring-blue-200 bg-blue-50/30' 
                : 'hover:shadow-md'
            } transition-all`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-blue-600" />
                  {getPriorityIcon(rec.priority)}
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {rec.title}
                  </CardTitle>
                  {isCompleted && <CheckCircle className="h-5 w-5 text-green-600" />}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getTypeColor(rec.type)}>
                    {rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}
                  </Badge>
                  {getStatusBadge(persistentRec.status, persistentRec.completed_at, persistentRec.is_manual_match)}
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    {isPending && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAssociateClick(persistentRec)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        disabled={isAssociating}
                      >
                        <Link className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {isCompleted && persistentRec.is_manual_match && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer l'association ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action supprimera l'association manuelle et remettra la recommandation 
                              "{rec.title}" en attente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDissociation(persistentRec)}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              Supprimer l'association
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    
                    {isPending && onRemoveRecommendation && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cette recommandation ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action supprimera définitivement la séance "{rec.title}" de votre suivi. 
                              Cette action ne peut pas être annulée.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => onRemoveRecommendation(persistentRec.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
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

              {/* Section de suivi */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-800">
                      Générée le {new Date(persistentRec.generated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Intensité: <span className="font-medium">{rec.intensity}</span> • 
                    Priorité: <span className="font-medium">{rec.priority}</span>
                  </div>
                </div>

                {isCompleted && persistentRec.matching_activity_id ? (
                  <div className="bg-green-100 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-800 mb-1">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium text-sm">
                        Séance réalisée le {new Date(persistentRec.completed_at!).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-green-700 text-sm">
                      {persistentRec.is_manual_match 
                        ? "Association créée manuellement"
                        : "Correspondance détectée automatiquement avec votre activité Strava"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-yellow-800 mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium text-sm">En attente de réalisation</span>
                    </div>
                    <p className="text-yellow-700 text-sm">
                      Réalisez votre séance ou utilisez le bouton d'association pour la lier manuellement
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Activity Selection Dialog */}
      <ActivitySelectionDialog
        isOpen={activityDialogOpen}
        onClose={() => {
          setActivityDialogOpen(false);
          setSelectedRecommendation(null);
        }}
        onConfirm={handleActivityAssociation}
        activities={activities}
        recommendation={selectedRecommendation?.recommendation_data || {} as AIRecommendation}
        isLoading={isAssociating}
      />
    </div>
  );
};

export default PersistentAIRecommendations;
