
import { Target } from 'lucide-react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const ActivitySelectionHeader = () => {
  return (
    <DialogHeader className="flex-shrink-0">
      <DialogTitle className="flex items-center gap-2">
        <Target className="h-5 w-5 text-blue-600" />
        Associer une activité à la recommandation
      </DialogTitle>
      <DialogDescription>
        Sélectionnez une activité Strava qui correspond à cette recommandation IA
      </DialogDescription>
    </DialogHeader>
  );
};

export default ActivitySelectionHeader;
