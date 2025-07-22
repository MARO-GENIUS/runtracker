
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
import { ThresholdWorkoutData } from '@/types/workoutTypes';
import { HelpCircle } from 'lucide-react';

interface ThresholdWorkoutFormProps {
  initialData?: ThresholdWorkoutData;
  onSave: (data: ThresholdWorkoutData) => void;
  onCancel: () => void;
  loading: boolean;
  expanded?: boolean;
}

export const ThresholdWorkoutForm: React.FC<ThresholdWorkoutFormProps> = ({
  initialData,
  onSave,
  onCancel,
  loading,
  expanded = true
}) => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ThresholdWorkoutData>({
    defaultValues: initialData || {
      duration: 20,
      targetPace: '4:15',
      heartRateZone: 'Zone 4',
      notes: ''
    }
  });

  const heartRateZone = watch('heartRateZone');
  const duration = watch('duration');
  const targetPace = watch('targetPace');

  const onSubmit = (data: ThresholdWorkoutData) => {
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
                  <p className="text-sm text-muted-foreground">Durée au seuil</p>
                  <p className="text-xl font-semibold">{duration} min</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Allure</p>
                  <p className="text-xl font-semibold">{targetPace} min/km</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Zone FC</p>
                  <p className="text-xl font-semibold">{heartRateZone}</p>
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

  // Full detailed view
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Label htmlFor="duration">Durée au seuil (minutes)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Temps total de course à l'allure seuil (en minutes)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="duration"
            type="number"
            min="5"
            max="60"
            {...register('duration', { 
              required: "Ce champ est requis", 
              valueAsNumber: true,
              min: { value: 5, message: "Minimum 5 minutes" },
              max: { value: 60, message: "Maximum 60 minutes" }
            })}
            className={errors.duration ? "border-destructive" : ""}
          />
          {errors.duration && (
            <p className="text-xs text-destructive mt-1">{errors.duration.message}</p>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Label htmlFor="targetPace">Allure seuil (min:sec/km)</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Format: minutes:secondes par km (ex: 4:15 pour 4min15s/km)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="targetPace"
            placeholder="4:15"
            {...register('targetPace', { 
              required: "Ce champ est requis",
              pattern: {
                value: /^[0-9]{1,2}:[0-9]{2}$/,
                message: "Format invalide. Utilisez mm:ss (ex: 4:15)"
              }
            })}
            className={errors.targetPace ? "border-destructive" : ""}
          />
          {errors.targetPace && (
            <p className="text-xs text-destructive mt-1">{errors.targetPace.message}</p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Label>Zone de fréquence cardiaque</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Zone 3: 80-87% FCmax (Tempo)<br />Zone 4: 87-92% FCmax (Seuil lactique)<br />Zone 5: 92-97% FCmax (VO2 Max)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
          placeholder="Objectifs, sensations, échauffement/récupération prévus..."
          {...register('notes')}
          className="min-h-24"
        />
      </div>

      <Card className="bg-muted/40 border-dashed">
        <CardContent className="pt-6">
          <div className="text-sm">
            <h4 className="font-medium mb-2">Résumé de la séance</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• {duration} minutes à l'allure seuil</li>
              <li>• Allure: {targetPace} min/km</li>
              <li>• Zone FC: {heartRateZone}</li>
              <li>• Distance approximative: ~{Math.round((duration * 1000) / parseInt(targetPace.split(':')[0]) / 60)}km</li>
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
