
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { LongRunWorkoutData } from '@/types/workoutTypes';

interface LongRunWorkoutFormProps {
  initialData?: LongRunWorkoutData;
  onSave: (data: LongRunWorkoutData) => void;
  onCancel: () => void;
  loading: boolean;
  expanded?: boolean;
}

export const LongRunWorkoutForm: React.FC<LongRunWorkoutFormProps> = ({
  initialData,
  onSave,
  onCancel,
  loading,
  expanded = true
}) => {
  const { register, handleSubmit, setValue, watch } = useForm<LongRunWorkoutData>({
    defaultValues: initialData || {
      duration: 90,
      targetPace: '5:45',
      negativeSplit: false,
      fuelStrategy: '',
      notes: ''
    }
  });

  const negativeSplit = watch('negativeSplit');
  const duration = watch('duration');
  const targetPace = watch('targetPace');
  const fuelStrategy = watch('fuelStrategy');

  const onSubmit = (data: LongRunWorkoutData) => {
    onSave(data);
  };

  // Simplified view for non-expanded mode
  if (!expanded) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center gap-x-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Durée</p>
                  <p className="text-xl font-semibold">{duration} min</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Allure</p>
                  <p className="text-xl font-semibold">{targetPace}</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {negativeSplit ? 'Avec negative split' : 'Sans negative split'}
              </div>
              {fuelStrategy && (
                <div className="text-xs text-muted-foreground mt-1">
                  Ravitaillement: {fuelStrategy}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="duration">Durée (minutes)</Label>
          <Input
            id="duration"
            type="number"
            min="60"
            max="240"
            {...register('duration', { valueAsNumber: true })}
          />
        </div>
        <div>
          <Label htmlFor="targetPace">Allure moyenne (min:sec/km)</Label>
          <Input
            id="targetPace"
            placeholder="5:45"
            {...register('targetPace')}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="negativeSplit"
          checked={negativeSplit}
          onCheckedChange={(checked) => setValue('negativeSplit', !!checked)}
        />
        <Label htmlFor="negativeSplit">
          Negative split (accélération progressive)
        </Label>
      </div>

      <div>
        <Label htmlFor="fuelStrategy">Stratégie de ravitaillement</Label>
        <Input
          id="fuelStrategy"
          placeholder="Ex: Gel toutes les 45min, eau toutes les 20min..."
          {...register('fuelStrategy')}
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          placeholder="Parcours, objectifs spécifiques, conditions prévues..."
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
