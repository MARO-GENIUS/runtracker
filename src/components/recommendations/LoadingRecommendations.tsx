
import { Card, CardContent } from '@/components/ui/card';

const LoadingRecommendations = () => {
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
};

export default LoadingRecommendations;
