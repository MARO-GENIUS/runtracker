
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { RecoveryWorkoutData } from '@/types/workoutTypes';

interface RecoveryWorkoutFormProps {
  initialData?: RecoveryWorkoutData;
  onSave: (data: RecoveryWorkoutData) => void;
  onCancel: () => void;
  loading: boolean;
  expanded?: boolean;
}

export const RecoveryWorkoutForm: React.FC<RecoveryWorkoutFormProps> = ({
  initialData,
  onSave,
  onCancel,
  loading,
  expanded = true
}) => {
  const { register, handleSubmit, setValue, watch } = useForm<RecoveryWorkoutData>({
    defaultValues: initialData || {
      duration: 30,
      targetPace: '6:00',
      activity: 'jogging',
      notes: ''
    }
  });

  const activity = watch('activity');
  const duration = watch('duration');
  const targetPace = watch('targetPace');

  const onSubmit = (data: RecoveryWorkoutData) => {
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
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Activité</p>
                  <p className="text-xl font-semibold capitalize">{activity}</p>
                </div>
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
          <Label htmlFor="duration">Durée (minutes)</Label>
          <Input
            id="duration"
            type="number"
            min="15"
            max="90"
            {...register('duration', { valueAsNumber: true })}
          />
        </div>
        <div>
          <Label htmlFor="targetPace">Allure (min:sec/km)</Label>
          <Input
            id="targetPace"
            placeholder="6:00"
            {...register('targetPace')}
          />
        </div>
      </div>

      <div>
        <Label>Type d'activité</Label>
        <Select value={activity} onValueChange={(value) => setValue('activity', value as any)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="jogging">Trottinement léger</SelectItem>
            <SelectItem value="walking">Marche active</SelectItem>
            <SelectItem value="cycling">Vélo tranquille</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          placeholder="Objectifs de récupération, étirements prévus..."
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
