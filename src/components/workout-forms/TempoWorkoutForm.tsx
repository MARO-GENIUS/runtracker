
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { TempoWorkoutData } from '@/types/workoutTypes';

interface TempoWorkoutFormProps {
  initialData?: TempoWorkoutData;
  onSave: (data: TempoWorkoutData) => void;
  onCancel: () => void;
  loading: boolean;
  expanded?: boolean;
}

export const TempoWorkoutForm: React.FC<TempoWorkoutFormProps> = ({
  initialData,
  onSave,
  onCancel,
  loading,
  expanded = true
}) => {
  const { register, handleSubmit, watch } = useForm<TempoWorkoutData>({
    defaultValues: initialData || {
      warmup: 15,
      tempoDistance: 5000,
      targetPace: '4:30',
      cooldown: 15,
      notes: ''
    }
  });

  const warmup = watch('warmup');
  const tempoDistance = watch('tempoDistance');
  const targetPace = watch('targetPace');
  const cooldown = watch('cooldown');

  const onSubmit = (data: TempoWorkoutData) => {
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
                  <p className="text-sm text-muted-foreground">Distance tempo</p>
                  <p className="text-xl font-semibold">{tempoDistance/1000} km</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Allure</p>
                  <p className="text-xl font-semibold">{targetPace}</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Échauffement: {warmup}min | Retour au calme: {cooldown}min
              </div>
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
