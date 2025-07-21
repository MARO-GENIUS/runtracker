import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IntervalWorkoutData } from '@/types/workoutTypes';

interface IntervalWorkoutFormProps {
  initialData?: IntervalWorkoutData;
  onSave: (data: IntervalWorkoutData) => void;
  onCancel: () => void;
  loading: boolean;
}

export const IntervalWorkoutForm: React.FC<IntervalWorkoutFormProps> = ({
  initialData,
  onSave,
  onCancel,
  loading
}) => {
  const { register, handleSubmit, setValue, watch } = useForm<IntervalWorkoutData>({
    defaultValues: initialData || {
      repetitions: 5,
      distance: 400,
      targetPace: '4:00',
      recoveryTime: 90,
      recoveryType: 'active',
      notes: ''
    }
  });

  const recoveryType = watch('recoveryType');

  const onSubmit = (data: IntervalWorkoutData) => {
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="repetitions">Nombre de répétitions</Label>
          <Input
            id="repetitions"
            type="number"
            min="1"
            max="20"
            {...register('repetitions', { valueAsNumber: true })}
          />
        </div>
        <div>
          <Label htmlFor="distance">Distance par répétition (m)</Label>
          <Input
            id="distance"
            type="number"
            min="100"
            max="5000"
            step="100"
            {...register('distance', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="targetPace">Allure cible (min:sec/km)</Label>
          <Input
            id="targetPace"
            placeholder="4:30"
            {...register('targetPace')}
          />
        </div>
        <div>
          <Label htmlFor="recoveryTime">Récupération (secondes)</Label>
          <Input
            id="recoveryTime"
            type="number"
            min="30"
            max="600"
            step="15"
            {...register('recoveryTime', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div>
        <Label>Type de récupération</Label>
        <Select value={recoveryType} onValueChange={(value) => setValue('recoveryType', value as 'active' | 'static')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Récupération active (trottinement)</SelectItem>
            <SelectItem value="static">Récupération statique (arrêt)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          placeholder="Objectifs, sensations, conditions..."
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