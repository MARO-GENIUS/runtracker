
import React from 'react';
import { IntervalWorkoutForm } from './IntervalWorkoutForm';
import { ThresholdWorkoutForm } from './ThresholdWorkoutForm';
import { EnduranceWorkoutForm } from './EnduranceWorkoutForm';
import { TempoWorkoutForm } from './TempoWorkoutForm';
import { HillWorkoutForm } from './HillWorkoutForm';
import { FartlekWorkoutForm } from './FartlekWorkoutForm';
import { RecoveryWorkoutForm } from './RecoveryWorkoutForm';
import { LongRunWorkoutForm } from './LongRunWorkoutForm';
import { WorkoutData } from '@/types/workoutTypes';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';

interface WorkoutDetailFormProps {
  sessionType: string;
  initialData?: any;
  onSave: (data: WorkoutData) => void;
  onCancel: () => void;
  loading: boolean;
  expanded?: boolean;
}

export const WorkoutDetailForm: React.FC<WorkoutDetailFormProps> = ({
  sessionType,
  initialData,
  onSave,
  onCancel,
  loading,
  expanded = true
}) => {
  const getSessionTypeInfo = () => {
    switch (sessionType?.toLowerCase()) {
      case 'intervals':
      case 'fractionné':
      case 'intervalles':
        return { 
          color: 'bg-red-100 text-red-800 border-red-200',
          description: 'Entraînement alternant des périodes d\'effort intense et de récupération'
        };
      
      case 'threshold':
      case 'seuil':
        return { 
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          description: 'Course à intensité élevée et stable, juste en dessous du seuil anaérobie'
        };
      
      case 'endurance':
      case 'endurance fondamentale':
      case 'easy':
        return { 
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          description: 'Course à allure modérée et confortable pour développer l\'endurance de base'
        };
      
      case 'tempo':
      case 'tempo run':
        return { 
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          description: 'Course à allure soutenue et constante, légèrement plus rapide que l\'allure d\'endurance'
        };
      
      case 'hills':
      case 'côtes':
      case 'hill repeats':
        return { 
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          description: 'Répétitions en montée pour développer la force et la puissance'
        };
      
      case 'fartlek':
        return { 
          color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          description: 'Entraînement par intervalles libres avec variations d\'allure'
        };
      
      case 'recovery':
      case 'récupération':
      case 'active recovery':
        return { 
          color: 'bg-green-100 text-green-800 border-green-200',
          description: 'Course très légère pour favoriser la récupération active'
        };
      
      case 'long':
      case 'long run':
      case 'sortie longue':
        return { 
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          description: 'Sortie longue à allure modérée pour développer l\'endurance'
        };
      
      default:
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          description: 'Type de séance personnalisé'
        };
    }
  };

  const typeInfo = getSessionTypeInfo();

  const getFormComponent = () => {
    switch (sessionType?.toLowerCase()) {
      case 'intervals':
      case 'fractionné':
      case 'intervalles':
        return <IntervalWorkoutForm initialData={initialData} onSave={onSave} onCancel={onCancel} loading={loading} expanded={expanded} />;
      
      case 'threshold':
      case 'seuil':
        return <ThresholdWorkoutForm initialData={initialData} onSave={onSave} onCancel={onCancel} loading={loading} expanded={expanded} />;
      
      case 'endurance':
      case 'endurance fondamentale':
      case 'easy':
        return <EnduranceWorkoutForm initialData={initialData} onSave={onSave} onCancel={onCancel} loading={loading} expanded={expanded} />;
      
      case 'tempo':
      case 'tempo run':
        return <TempoWorkoutForm initialData={initialData} onSave={onSave} onCancel={onCancel} loading={loading} expanded={expanded} />;
      
      case 'hills':
      case 'côtes':
      case 'hill repeats':
        return <HillWorkoutForm initialData={initialData} onSave={onSave} onCancel={onCancel} loading={loading} expanded={expanded} />;
      
      case 'fartlek':
        return <FartlekWorkoutForm initialData={initialData} onSave={onSave} onCancel={onCancel} loading={loading} expanded={expanded} />;
      
      case 'recovery':
      case 'récupération':
      case 'active recovery':
        return <RecoveryWorkoutForm initialData={initialData} onSave={onSave} onCancel={onCancel} loading={loading} expanded={expanded} />;
      
      case 'long':
      case 'long run':
      case 'sortie longue':
        return <LongRunWorkoutForm initialData={initialData} onSave={onSave} onCancel={onCancel} loading={loading} expanded={expanded} />;
      
      default:
        return <EnduranceWorkoutForm initialData={initialData} onSave={onSave} onCancel={onCancel} loading={loading} expanded={expanded} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className={`p-3 rounded-lg border ${typeInfo.color} transition-all duration-300`}>
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium">
            Type de séance: <span>{sessionType}</span>
          </p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <Info className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{typeInfo.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      {getFormComponent()}
    </div>
  );
};
