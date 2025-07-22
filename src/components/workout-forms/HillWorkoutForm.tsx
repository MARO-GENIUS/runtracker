
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
import { HillWorkoutData } from '@/types/workoutTypes';
import { HelpCircle, MountainSnow } from 'lucide-react';

interface HillWorkoutFormProps {
  initialData?: HillWorkoutData;
  onSave: (data: HillWorkoutData) => void;
  onCancel: () => void;
  loading: boolean;
  expanded?: boolean;
}

export const HillWorkoutForm: React.FC<HillWorkoutFormProps> = ({
  initialData,
  onSave,
  onCancel,
  loading,
  expanded = true
}) => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<HillWorkoutData>({
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
  const repetitions = watch('repetitions');
  const hillDistance = watch('hillDistance');
  const gradient = watch('gradient');
  const recoveryTime = watch('recoveryTime');

  const onSubmit = (data: HillWorkoutData) => {
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
                  <p className="text-sm text-muted-foreground">Côtes</p>
                  <p className="text-xl font-semibold">{repetitions}×</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Distance</p>
                  <p className="text-xl font-semibold">{hillDistance}m</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Pente</p>
                  <p className="text-xl font-semibold">{gradient}%</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Intensité: {targetEffort}
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
            <Label htmlFor="repetitions">Nombre de côtes</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Nombre total de répétitions en côte</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="repetitions"
            type="number"
            min="3"
            max="15"
            {...register('repetitions', { 
              required: "Ce champ est requis", 
              valueAsNumber: true,
              min: { value: 3, message: "Minimum 3 répétitions" },
              max: { value: 15, message: "Maximum 15 répétitions" }
            })}
            className={errors.repetitions ? "border-destructive" : ""}
          />
          {errors.repetitions && (
            <p className="text-xs text-destructive mt-1">{errors.repetitions.message}</p>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Label htmlFor="hillDistance">Distance par côte (m)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Longueur de la montée en mètres</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="hillDistance"
            type="number"
            min="100"
            max="1000"
            step="50"
            {...register('hillDistance', { 
              required: "Ce champ est requis", 
              valueAsNumber: true,
              min: { value: 100, message: "Minimum 100m" },
              max: { value: 1000, message: "Maximum 1000m" }
            })}
            className={errors.hillDistance ? "border-destructive" : ""}
          />
          {errors.hillDistance && (
            <p className="text-xs text-destructive mt-1">{errors.hillDistance.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Label htmlFor="gradient">Pente (%)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Pourcentage d'inclinaison (3-8% modérée, 8-15% raide, 15%+ très raide)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="gradient"
            type="number"
            min="3"
            max="25"
            {...register('gradient', { 
              required: "Ce champ est requis", 
              valueAsNumber: true,
              min: { value: 3, message: "Minimum 3%" },
              max: { value: 25, message: "Maximum 25%" }
            })}
            className={errors.gradient ? "border-destructive" : ""}
          />
          {errors.gradient && (
            <p className="text-xs text-destructive mt-1">{errors.gradient.message}</p>
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
            min="60"
            max="300"
            step="15"
            {...register('recoveryTime', { 
              required: "Ce champ est requis", 
              valueAsNumber: true,
              min: { value: 60, message: "Minimum 60 secondes" },
              max: { value: 300, message: "Maximum 5 minutes (300 secondes)" }
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
          <Label>Intensité cible</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Niveau d'effort à fournir pour chaque répétition</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
          placeholder="Type de côte, technique, objectifs, parcours spécifique..."
          {...register('notes')}
          className="min-h-24"
        />
      </div>

      <Card className="bg-muted/40 border-dashed">
        <CardContent className="pt-6">
          <div className="text-sm">
            <h4 className="font-medium mb-2 flex items-center gap-1.5">
              <MountainSnow className="h-4 w-4" />
              <span>Résumé de la séance en côtes</span>
            </h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• {repetitions} répétitions de {hillDistance}m</li>
              <li>• Pente: {gradient}%</li>
              <li>• Récupération: {recoveryTime}s</li>
              <li>• Intensité: {targetEffort}</li>
              <li>• Distance totale des côtes: {repetitions * hillDistance}m</li>
              <li>• Dénivelé positif total: ~{Math.round(repetitions * hillDistance * gradient / 100)}m</li>
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
