import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FartlekWorkoutData } from '@/types/workoutTypes';
import { Plus, Minus } from 'lucide-react';

interface FartlekWorkoutFormProps {
  initialData?: FartlekWorkoutData;
  onSave: (data: FartlekWorkoutData) => void;
  onCancel: () => void;
  loading: boolean;
}

export const FartlekWorkoutForm: React.FC<FartlekWorkoutFormProps> = ({
  initialData,
  onSave,
  onCancel,
  loading
}) => {
  const { register, control, handleSubmit, setValue } = useForm<FartlekWorkoutData>({
    defaultValues: initialData || {
      totalDuration: 40,
      intervals: [
        { duration: 2, intensity: 'hard', description: 'Accélération' },
        { duration: 2, intensity: 'easy', description: 'Récupération' }
      ],
      notes: ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'intervals'
  });

  const onSubmit = (data: FartlekWorkoutData) => {
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="totalDuration">Durée totale (minutes)</Label>
        <Input
          id="totalDuration"
          type="number"
          min="20"
          max="90"
          {...register('totalDuration', { valueAsNumber: true })}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <Label>Intervalles de jeu</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ duration: 1, intensity: 'moderate', description: '' })}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-2 p-3 border rounded-lg">
              <div className="flex-1">
                <Label>Durée (min)</Label>
                <Input
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.5"
                  {...register(`intervals.${index}.duration`, { valueAsNumber: true })}
                />
              </div>
              <div className="flex-1">
                <Label>Intensité</Label>
                <Select
                  onValueChange={(value) => setValue(`intervals.${index}.intensity`, value as any)}
                  defaultValue={field.intensity}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Facile</SelectItem>
                    <SelectItem value="moderate">Modéré</SelectItem>
                    <SelectItem value="hard">Difficile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-2">
                <Label>Description</Label>
                <Input
                  placeholder="Ex: Sprint, Récupération..."
                  {...register(`intervals.${index}.description`)}
                />
              </div>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          placeholder="Consignes, parcours, objectifs..."
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