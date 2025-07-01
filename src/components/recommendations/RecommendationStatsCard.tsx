
import { Card, CardContent } from '@/components/ui/card';
import { Target } from 'lucide-react';

interface RecommendationStatsCardProps {
  completedCount: number;
  totalCount: number;
  completionRate: number;
}

const RecommendationStatsCard = ({ completedCount, totalCount, completionRate }: RecommendationStatsCardProps) => {
  return (
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
  );
};

export default RecommendationStatsCard;
