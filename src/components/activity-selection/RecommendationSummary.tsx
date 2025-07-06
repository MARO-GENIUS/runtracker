
import { Clock, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AIRecommendation } from '@/hooks/useAICoach';

interface RecommendationSummaryProps {
  recommendation: AIRecommendation;
}

const RecommendationSummary = ({ recommendation }: RecommendationSummaryProps) => {
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

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex-shrink-0">
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
  );
};

export default RecommendationSummary;
