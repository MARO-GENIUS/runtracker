import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnduranceWorkoutData } from '@/types/workoutTypes';

interface EnduranceWorkoutFormProps {
  initialData?: EnduranceWorkoutData;
  onSave: (data: EnduranceWorkoutData) => void;
  onCancel: () => void;
  loading: boolean;
}

export const EnduranceWorkoutForm: React.FC<EnduranceWorkoutFormProps> = ({
  initialData,
  onSave,
  onCancel,
  loading
}) => {
  const { register, handleSubmit, setValue, watch } = useForm<EnduranceWorkoutData>({
    defaultValues: initialData || {
      duration: 45,
      targetPace: '5:30',
      heartRateZone: 'Zone 2',
      notes: ''
    }
  });

  const heartRateZone = watch('heartRateZone');

  const onSubmit = (data: EnduranceWorkoutData) => {
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="duration">Durée totale (minutes)</Label>
          <Input
            id="duration"
            type="number"
            min="15"
            max="180"
            {...register('duration', { valueAsNumber: true })}
          />
        </div>
        <div>
          <Label htmlFor="targetPace">Allure moyenne (min:sec/km)</Label>
          <Input
            id="targetPace"
            placeholder="5:30"
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
            <SelectItem value="Zone 1">Zone 1 (Récupération active)</SelectItem>
            <SelectItem value="Zone 2">Zone 2 (Endurance fondamentale)</SelectItem>
            <SelectItem value="Zone 3">Zone 3 (Tempo)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          placeholder="Parcours, objectifs, sensations attendues..."
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