import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TempoWorkoutData } from '@/types/workoutTypes';

interface TempoWorkoutFormProps {
  initialData?: TempoWorkoutData;
  onSave: (data: TempoWorkoutData) => void;
  onCancel: () => void;
  loading: boolean;
}

export const TempoWorkoutForm: React.FC<TempoWorkoutFormProps> = ({
  initialData,
  onSave,
  onCancel,
  loading
}) => {
  const { register, handleSubmit } = useForm<TempoWorkoutData>({
    defaultValues: initialData || {
      warmup: 15,
      tempoDistance: 5000,
      targetPace: '4:30',
      cooldown: 15,
      notes: ''
    }
  });

  const onSubmit = (data: TempoWorkoutData) => {
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="warmup">Échauffement (minutes)</Label>
          <Input
            id="warmup"
            type="number"
            min="5"
            max="30"
            {...register('warmup', { valueAsNumber: true })}
          />
        </div>
        <div>
          <Label htmlFor="cooldown">Retour au calme (minutes)</Label>
          <Input
            id="cooldown"
            type="number"
            min="5"
            max="30"
            {...register('cooldown', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tempoDistance">Distance tempo (mètres)</Label>
          <Input
            id="tempoDistance"
            type="number"
            min="1000"
            max="15000"
            step="1000"
            {...register('tempoDistance', { valueAsNumber: true })}
          />
        </div>
        <div>
          <Label htmlFor="targetPace">Allure tempo (min:sec/km)</Label>
          <Input
            id="targetPace"
            placeholder="4:30"
            {...register('targetPace')}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          placeholder="Objectifs, parcours, conditions..."
          {...register('notes')}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
};