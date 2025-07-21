import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThresholdWorkoutData } from '@/types/workoutTypes';

interface ThresholdWorkoutFormProps {
  initialData?: ThresholdWorkoutData;
  onSave: (data: ThresholdWorkoutData) => void;
  onCancel: () => void;
  loading: boolean;
}

export const ThresholdWorkoutForm: React.FC<ThresholdWorkoutFormProps> = ({
  initialData,
  onSave,
  onCancel,
  loading
}) => {
  const { register, handleSubmit, setValue, watch } = useForm<ThresholdWorkoutData>({
    defaultValues: initialData || {
      duration: 20,
      targetPace: '4:15',
      heartRateZone: 'Zone 4',
      notes: ''
    }
  });

  const heartRateZone = watch('heartRateZone');

  const onSubmit = (data: ThresholdWorkoutData) => {
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="duration">Durée au seuil (minutes)</Label>
          <Input
            id="duration"
            type="number"
            min="5"
            max="60"
            {...register('duration', { valueAsNumber: true })}
          />
        </div>
        <div>
          <Label htmlFor="targetPace">Allure seuil (min:sec/km)</Label>
          <Input
            id="targetPace"
            placeholder="4:15"
            {...register('targetPace')}
          />
        </div>
      </div>

      <div>
        <Label>Zone de fréquence cardiaque</Label>
        <Select value={heartRateZone} onValueChange={(value) => setValue('heartRateZone', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Zone 3">Zone 3 (Tempo)</SelectItem>
            <SelectItem value="Zone 4">Zone 4 (Seuil lactique)</SelectItem>
            <SelectItem value="Zone 5">Zone 5 (VO2 Max)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          placeholder="Objectifs, sensations, échauffement/récupération..."
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