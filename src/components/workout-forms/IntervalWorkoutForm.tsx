
import React from 'react';
import { useForm } from 'react-hook-form';
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
import { IntervalWorkoutData } from '@/types/workoutTypes';
import { HelpCircle } from 'lucide-react';

interface IntervalWorkoutFormProps {
  initialData?: IntervalWorkoutData;
  onSave: (data: IntervalWorkoutData) => void;
  onCancel: () => void;
  loading: boolean;
  expanded?: boolean;
}

export const IntervalWorkoutForm: React.FC<IntervalWorkoutFormProps> = ({
  initialData,
  onSave,
  onCancel,
  loading,
  expanded = true
}) => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<IntervalWorkoutData>({
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
  const repetitions = watch('repetitions');
  const distance = watch('distance');
  const targetPace = watch('targetPace');

  const totalDistance = repetitions * distance;
  
  const onSubmit = (data: IntervalWorkoutData) => {
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
                  <p className="text-sm text-muted-foreground">Répétitions</p>
                  <p className="text-xl font-semibold">{repetitions}×</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Distance</p>
                  <p className="text-xl font-semibold">{distance}m</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Allure</p>
                  <p className="text-xl font-semibold">{targetPace}</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Total: {totalDistance}m
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Label htmlFor="repetitions">Nombre de répétitions</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Le nombre de fois que vous allez répéter l'intervalle à haute intensité</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="repetitions"
            type="number"
            min="1"
            max="20"
            {...register('repetitions', { 
              required: "Ce champ est requis", 
              valueAsNumber: true,
              min: { value: 1, message: "Minimum 1 répétition" },
              max: { value: 20, message: "Maximum 20 répétitions" }
            })}
            className={errors.repetitions ? "border-destructive" : ""}
          />
          {errors.repetitions && (
            <p className="text-xs text-destructive mt-1">{errors.repetitions.message}</p>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Label htmlFor="distance">Distance par répétition (m)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Distance de chaque répétition en mètres (ex: 400m pour un tour de piste)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="distance"
            type="number"
            min="100"
            max="5000"
            step="100"
            {...register('distance', { 
              required: "Ce champ est requis", 
              valueAsNumber: true,
              min: { value: 100, message: "Minimum 100m" },
              max: { value: 5000, message: "Maximum 5000m" }
            })}
            className={errors.distance ? "border-destructive" : ""}
          />
          {errors.distance && (
            <p className="text-xs text-destructive mt-1">{errors.distance.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Label htmlFor="targetPace">Allure cible (min:sec/km)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Format: minutes:secondes par km (ex: 4:30 pour 4min30s/km)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="targetPace"
            placeholder="4:30"
            {...register('targetPace', { 
              required: "Ce champ est requis",
              pattern: {
                value: /^[0-9]{1,2}:[0-9]{2}$/,
                message: "Format invalide. Utilisez mm:ss (ex: 4:30)"
              }
            })}
            className={errors.targetPace ? "border-destructive" : ""}
          />
          {errors.targetPace && (
            <p className="text-xs text-destructive mt-1">{errors.targetPace.message}</p>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Label htmlFor="recoveryTime">Récupération (secondes)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Temps de récupération entre chaque répétition (en secondes)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="recoveryTime"
            type="number"
            min="30"
            max="600"
            step="15"
            {...register('recoveryTime', { 
              required: "Ce champ est requis", 
              valueAsNumber: true,
              min: { value: 30, message: "Minimum 30 secondes" },
              max: { value: 600, message: "Maximum 10 minutes (600 secondes)" }
            })}
            className={errors.recoveryTime ? "border-destructive" : ""}
          />
          {errors.recoveryTime && (
            <p className="text-xs text-destructive mt-1">{errors.recoveryTime.message}</p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Label>Type de récupération</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Active: trottinement léger pendant la récupération<br />Statique: arrêt complet</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Select 
          value={recoveryType} 
          onValueChange={(value) => setValue('recoveryType', value as 'active' | 'static')}
        >
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
          placeholder="Objectifs, sensations, conditions, parcours spécifique..."
          {...register('notes')}
          className="min-h-24"
        />
      </div>

      <Card className="bg-muted/40 border-dashed">
        <CardContent className="pt-6">
          <div className="text-sm">
            <h4 className="font-medium mb-2">Résumé de la séance</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• {repetitions} répétitions de {distance}m</li>
              <li>• Allure: {targetPace} min/km</li>
              <li>• Récupération: {watch('recoveryTime')}s ({watch('recoveryType') === 'active' ? 'active' : 'statique'})</li>
              <li>• Distance totale des intervalles: {totalDistance}m</li>
            </ul>
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
