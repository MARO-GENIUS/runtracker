
import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FartlekWorkoutData } from '@/types/workoutTypes';
import { Plus, Minus, HelpCircle, Zap, ArrowUp, ArrowDown } from 'lucide-react';

interface FartlekWorkoutFormProps {
  initialData?: FartlekWorkoutData;
  onSave: (data: FartlekWorkoutData) => void;
  onCancel: () => void;
  loading: boolean;
  expanded?: boolean;
}

export const FartlekWorkoutForm: React.FC<FartlekWorkoutFormProps> = ({
  initialData,
  onSave,
  onCancel,
  loading,
  expanded = true
}) => {
  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<FartlekWorkoutData>({
    defaultValues: initialData || {
      totalDuration: 40,
      intervals: [
        { duration: 2, intensity: 'hard', description: 'Accélération' },
        { duration: 2, intensity: 'easy', description: 'Récupération' }
      ],
      notes: ''
    }
  });

  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: 'intervals'
  });

  const totalDuration = watch('totalDuration');
  const intervals = watch('intervals');

  // Calculate total duration of all intervals
  const intervalsDuration = intervals.reduce((total, interval) => total + interval.duration, 0);

  const getIntensityBadge = (intensity: string) => {
    switch (intensity) {
      case 'easy':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Facile</Badge>;
      case 'moderate':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Modéré</Badge>;
      case 'hard':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Difficile</Badge>;
      default:
        return <Badge variant="outline">{intensity}</Badge>;
    }
  };

  const onSubmit = (data: FartlekWorkoutData) => {
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
                  <p className="text-sm text-muted-foreground">Durée totale</p>
                  <p className="text-xl font-semibold">{totalDuration} min</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Variations</p>
                  <p className="text-xl font-semibold">{intervals.length}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 justify-center mt-2">
                {intervals.slice(0, 4).map((interval, index) => (
                  <Badge 
                    key={index}
                    variant="outline" 
                    className={
                      interval.intensity === 'easy' ? 'bg-green-50 border-green-200' :
                      interval.intensity === 'moderate' ? 'bg-blue-50 border-blue-200' :
                      'bg-red-50 border-red-200'
                    }
                  >
                    {interval.duration}min
                  </Badge>
                ))}
                {intervals.length > 4 && (
                  <Badge variant="outline">+{intervals.length - 4}</Badge>
                )}
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

  // Full detailed view
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Label htmlFor="totalDuration">Durée totale (minutes)</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Durée totale de la séance, incluant l'échauffement et le retour au calme</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Input
          id="totalDuration"
          type="number"
          min="20"
          max="90"
          {...register('totalDuration', { 
            required: "Ce champ est requis", 
            valueAsNumber: true,
            min: { value: 20, message: "Minimum 20 minutes" },
            max: { value: 90, message: "Maximum 90 minutes" }
          })}
          className={errors.totalDuration ? "border-destructive" : ""}
        />
        {errors.totalDuration && (
          <p className="text-xs text-destructive mt-1">{errors.totalDuration.message}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Label>Intervalles de jeu</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-3">
                  <h4 className="font-semibold mb-1">Qu'est-ce que le Fartlek?</h4>
                  <p className="text-sm mb-2">Le Fartlek (« jeu de vitesse » en suédois) est un entraînement où vous alternez librement différentes intensités.</p>
                  <ul className="text-xs space-y-1">
                    <li>• <strong>Facile</strong>: récupération active, respiration confortable</li>
                    <li>• <strong>Modéré</strong>: allure tempo, conversation difficile</li>
                    <li>• <strong>Difficile</strong>: proche de l'allure seuil ou interval, conversation impossible</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ duration: 1, intensity: 'moderate', description: '' })}
            className="text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Ajouter
          </Button>
        </div>
        
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {fields.map((field, index) => (
            <div key={field.id} className={`flex items-end gap-2 p-3 border rounded-lg ${
              intervals[index]?.intensity === 'easy' ? 'bg-green-50 border-green-200' :
              intervals[index]?.intensity === 'moderate' ? 'bg-blue-50 border-blue-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className="w-16">
                <Label className="text-xs">Durée (min)</Label>
                <Input
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.5"
                  {...register(`intervals.${index}.duration`, { 
                    required: "Requis", 
                    valueAsNumber: true,
                    min: { value: 0.5, message: "Min 0.5" },
                    max: { value: 10, message: "Max 10" }
                  })}
                  className={`text-sm h-8 ${errors.intervals?.[index]?.duration ? "border-destructive" : ""}`}
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Intensité</Label>
                <Select
                  onValueChange={(value) => setValue(`intervals.${index}.intensity`, value as any)}
                  defaultValue={field.intensity}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Facile</SelectItem>
                    <SelectItem value="moderate">Modéré</SelectItem>
                    <SelectItem value="hard">Difficile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-xs">Description</Label>
                <Input
                  placeholder="Ex: Sprint, Jogging..."
                  {...register(`intervals.${index}.description`)}
                  className="text-sm h-8"
                />
              </div>
              <div className="flex gap-1">
                {index > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => swap(index, index - 1)}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                )}
                {index < fields.length - 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => swap(index, index + 1)}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                )}
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="h-8 w-8 p-0 text-destructive"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {errors.intervals && (
          <p className="text-xs text-destructive mt-1">Veuillez vérifier tous les intervalles</p>
        )}
      </div>

      <div>
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          placeholder="Consignes, parcours, objectifs..."
          {...register('notes')}
          className="min-h-24"
        />
      </div>

      <Card className="bg-muted/40 border-dashed">
        <CardContent className="pt-6">
          <div className="text-sm">
            <h4 className="font-medium mb-2 flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-500" />
              <span>Résumé de la séance Fartlek</span>
            </h4>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-muted-foreground">Durée totale:</p>
                <p className="font-medium">{totalDuration} minutes</p>
              </div>
              <div>
                <p className="text-muted-foreground">Durée des intervalles:</p>
                <p className="font-medium">{intervalsDuration} minutes</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-muted-foreground">Séquence des intervalles:</p>
              <div className="flex flex-wrap gap-1.5">
                {intervals.map((interval, idx) => (
                  <div key={idx} className="flex items-center">
                    {idx > 0 && <span className="text-muted-foreground mx-0.5">→</span>}
                    <div className="flex items-center gap-1 border rounded px-2 py-0.5 text-xs">
                      <span>{interval.duration}min</span>
                      {getIntensityBadge(interval.intensity)}
                      {interval.description && (
                        <span className="text-muted-foreground truncate max-w-[80px]">
                          {interval.description}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
