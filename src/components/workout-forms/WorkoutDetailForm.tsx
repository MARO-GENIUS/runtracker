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

interface WorkoutDetailFormProps {
  sessionType: string;
  initialData?: any;
  onSave: (data: WorkoutData) => void;
  onCancel: () => void;
  loading: boolean;
}

export const WorkoutDetailForm: React.FC<WorkoutDetailFormProps> = ({
  sessionType,
  initialData,
  onSave,
  onCancel,
  loading
}) => {
  const getFormComponent = () => {
    switch (sessionType?.toLowerCase()) {
      case 'intervals':
      case 'fractionné':
      case 'intervalles':
        return <IntervalWorkoutForm initialData={initialData} onSave={onSave} onCancel={onCancel} loading={loading} />;
      
      case 'threshold':
      case 'seuil':
        return <ThresholdWorkoutForm initialData={initialData} onSave={onSave} onCancel={onCancel} loading={loading} />;
      
      case 'endurance':
      case 'endurance fondamentale':
      case 'easy':
        return <EnduranceWorkoutForm initialData={initialData} onSave={onSave} onCancel={onCancel} loading={loading} />;
      
      case 'tempo':
      case 'tempo run':
        return <TempoWorkoutForm initialData={initialData} onSave={onSave} onCancel={onCancel} loading={loading} />;
      
      case 'hills':
      case 'côtes':
      case 'hill repeats':
        return <HillWorkoutForm initialData={initialData} onSave={onSave} onCancel={onCancel} loading={loading} />;
      
      case 'fartlek':
        return <FartlekWorkoutForm initialData={initialData} onSave={onSave} onCancel={onCancel} loading={loading} />;
      
      case 'recovery':
      case 'récupération':
      case 'active recovery':
        return <RecoveryWorkoutForm initialData={initialData} onSave={onSave} onCancel={onCancel} loading={loading} />;
      
      case 'long':
      case 'long run':
      case 'sortie longue':
        return <LongRunWorkoutForm initialData={initialData} onSave={onSave} onCancel={onCancel} loading={loading} />;
      
      default:
        return <EnduranceWorkoutForm initialData={initialData} onSave={onSave} onCancel={onCancel} loading={loading} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          Type de séance: <span className="font-medium text-foreground">{sessionType}</span>
        </p>
      </div>
      {getFormComponent()}
    </div>
  );
};