
import { Card, CardContent } from '@/components/ui/card';
import { Target } from 'lucide-react';

const EmptyRecommendations = () => {
  return (
    <Card>
      <CardContent className="p-6 text-center text-gray-500">
        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Aucune recommandation IA sauvegardée</p>
        <p className="text-sm mt-2">Utilisez le bouton "Analyser avec l'IA" pour générer des recommandations</p>
      </CardContent>
    </Card>
  );
};

export default EmptyRecommendations;
