import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HillWorkoutData } from '@/types/workoutTypes';

interface HillWorkoutFormProps {
  initialData?: HillWorkoutData;
  onSave: (data: HillWorkoutData) => void;
  onCancel: () => void;
  loading: boolean;
}

export const HillWorkoutForm: React.FC<HillWorkoutFormProps> = ({
  initialData,
  onSave,
  onCancel,
  loading
}) => {
  const { register, handleSubmit, setValue, watch } = useForm<HillWorkoutData>({
    defaultValues: initialData || {
      repetitions: 6,
      hillDistance: 200,
      gradient: 8,
      recoveryTime: 120,
      targetEffort: 'Fort',
      notes: ''
    }
  });

  const targetEffort = watch('targetEffort');

  const onSubmit = (data: HillWorkoutData) => {
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="repetitions">Nombre de côtes</Label>
          <Input
            id="repetitions"
            type="number"
            min="3"
            max="15"
            {...register('repetitions', { valueAsNumber: true })}
          />
        </div>
        <div>
          <Label htmlFor="hillDistance">Distance par côte (m)</Label>
          <Input
            id="hillDistance"
            type="number"
            min="100"
            max="1000"
            step="50"
            {...register('hillDistance', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="gradient">Pente (%)</Label>
          <Input
            id="gradient"
            type="number"
            min="3"
            max="25"
            {...register('gradient', { valueAsNumber: true })}
          />
        </div>
        <div>
          <Label htmlFor="recoveryTime">Récupération (secondes)</Label>
          <Input
            id="recoveryTime"
            type="number"
            min="60"
            max="300"
            step="15"
            {...register('recoveryTime', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div>
        <Label>Intensité cible</Label>
        <Select value={targetEffort} onValueChange={(value) => setValue('targetEffort', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Modéré">Modéré (70-80% effort)</SelectItem>
            <SelectItem value="Fort">Fort (80-90% effort)</SelectItem>
            <SelectItem value="Maximal">Maximal (90-95% effort)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          placeholder="Type de côte, technique, objectifs..."
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