
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Settings, Target, Calendar as CalendarIcon, Clock, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TrainingSettings {
  targetRace: 'recuperation' | '5k' | '10k' | 'semi' | 'marathon';
  targetDate?: Date;
  targetTimeMinutes?: number;
  weeklyFrequency: number;
  preferredDays: string[];
  availableTimeSlots: string[];
  maxIntensity: 'low' | 'medium' | 'high';
}

interface TrainingSettingsProps {
  settings: TrainingSettings;
  onUpdateSettings: (settings: TrainingSettings) => Promise<boolean>;
}

const TrainingSettings = ({ settings, onUpdateSettings }: TrainingSettingsProps) => {
  const [localSettings, setLocalSettings] = useState<TrainingSettings>(settings);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [targetHours, setTargetHours] = useState<string>('');
  const [targetMinutes, setTargetMinutes] = useState<string>('');

  // Update local settings when props change
  useEffect(() => {
    setLocalSettings(settings);
    
    // Convert target time to hours and minutes for display
    if (settings.targetTimeMinutes) {
      const hours = Math.floor(settings.targetTimeMinutes / 60);
      const minutes = settings.targetTimeMinutes % 60;
      setTargetHours(hours.toString());
      setTargetMinutes(minutes.toString().padStart(2, '0'));
    } else {
      setTargetHours('');
      setTargetMinutes('');
    }
  }, [settings]);

  const raceOptions = [
    { value: 'recuperation', label: 'Récupération/Forme', distance: '' },
    { value: '5k', label: '5 kilomètres', distance: '5K' },
    { value: '10k', label: '10 kilomètres', distance: '10K' },
    { value: 'semi', label: 'Semi-marathon', distance: '21K' },
    { value: 'marathon', label: 'Marathon', distance: '42K' }
  ];

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const timeSlots = ['Matin (6h-9h)', 'Midi (11h-14h)', 'Soir (17h-20h)'];
  const intensityLevels = [
    { value: 'low', label: 'Faible - Récupération et endurance' },
    { value: 'medium', label: 'Modérée - Avec séances seuil' },
    { value: 'high', label: 'Élevée - Incluant fractionné' }
  ];

  const hasRaceGoal = localSettings.targetRace !== 'recuperation';

  const handleSave = async () => {
    setIsSaving(true);
    
    // Convert hours and minutes to total minutes
    let targetTimeMinutes: number | undefined;
    if (hasRaceGoal && targetHours && targetMinutes) {
      const hours = parseInt(targetHours) || 0;
      const minutes = parseInt(targetMinutes) || 0;
      targetTimeMinutes = hours * 60 + minutes;
    }

    const settingsToSave = {
      ...localSettings,
      targetTimeMinutes,
      // Clear target date and time if no race goal
      targetDate: hasRaceGoal ? localSettings.targetDate : undefined
    };

    const success = await onUpdateSettings(settingsToSave);
    setIsSaving(false);
    
    if (success) {
      setIsOpen(false);
    }
  };

  const handleRaceChange = (value: string) => {
    const newSettings = { 
      ...localSettings, 
      targetRace: value as TrainingSettings['targetRace']
    };
    
    // Clear target date and time if switching to recovery mode
    if (value === 'recuperation') {
      newSettings.targetDate = undefined;
      setTargetHours('');
      setTargetMinutes('');
    }
    
    setLocalSettings(newSettings);
  };

  const handleTimeChange = (field: 'hours' | 'minutes', value: string) => {
    if (field === 'hours') {
      setTargetHours(value);
    } else {
      setTargetMinutes(value);
    }
  };

  const handleDayToggle = (day: string) => {
    const newDays = localSettings.preferredDays.includes(day)
      ? localSettings.preferredDays.filter(d => d !== day)
      : [...localSettings.preferredDays, day];
    setLocalSettings({ ...localSettings, preferredDays: newDays });
  };

  const handleTimeSlotToggle = (slot: string) => {
    const newSlots = localSettings.availableTimeSlots.includes(slot)
      ? localSettings.availableTimeSlots.filter(s => s !== slot)
      : [...localSettings.availableTimeSlots, slot];
    setLocalSettings({ ...localSettings, availableTimeSlots: newSlots });
  };

  const getCurrentRaceLabel = () => {
    const race = raceOptions.find(r => r.value === settings.targetRace);
    return race ? race.label : 'Non défini';
  };

  const formatTargetInfo = () => {
    if (settings.targetRace === 'recuperation') return '';
    
    let info = '';
    if (settings.targetDate) {
      info += ` le ${format(settings.targetDate, 'dd/MM/yyyy', { locale: fr })}`;
    }
    if (settings.targetTimeMinutes) {
      const hours = Math.floor(settings.targetTimeMinutes / 60);
      const minutes = settings.targetTimeMinutes % 60;
      info += ` en ${hours}h${minutes.toString().padStart(2, '0')}`;
    }
    return info;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
          <Settings className="h-4 w-4 mr-2" />
          Objectifs
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Configuration de l'entraînement
          </DialogTitle>
          <DialogDescription>
            Personnalisez vos objectifs et préférences pour recevoir des recommandations adaptées
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Objectif de course */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Objectif de course
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={localSettings.targetRace} 
                onValueChange={handleRaceChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un objectif" />
                </SelectTrigger>
                <SelectContent>
                  {raceOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.label}</span>
                        {option.distance && (
                          <Badge variant="outline" className="ml-auto">
                            {option.distance}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Date et temps objectif - Affiché uniquement si un objectif de course est sélectionné */}
          {hasRaceGoal && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Objectif spécifique
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date de l'objectif */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Date de la course</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !localSettings.targetDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localSettings.targetDate ? (
                          format(localSettings.targetDate, "dd/MM/yyyy", { locale: fr })
                        ) : (
                          <span>Choisir une date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={localSettings.targetDate}
                        onSelect={(date) => setLocalSettings({ ...localSettings, targetDate: date })}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Temps objectif */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Temps objectif (optionnel)</label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        placeholder="2"
                        value={targetHours}
                        onChange={(e) => handleTimeChange('hours', e.target.value)}
                        className="w-16 text-center"
                        min="0"
                        max="12"
                      />
                      <span className="text-sm text-gray-500">h</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        placeholder="30"
                        value={targetMinutes}
                        onChange={(e) => handleTimeChange('minutes', e.target.value)}
                        className="w-16 text-center"
                        min="0"
                        max="59"
                      />
                      <span className="text-sm text-gray-500">min</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Ex: 2h00 pour un semi-marathon, 4h30 pour un marathon
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fréquence d'entraînement */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Fréquence d'entraînement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={localSettings.weeklyFrequency.toString()} 
                onValueChange={(value) => setLocalSettings({ ...localSettings, weeklyFrequency: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 séances par semaine</SelectItem>
                  <SelectItem value="3">3 séances par semaine</SelectItem>
                  <SelectItem value="4">4 séances par semaine</SelectItem>
                  <SelectItem value="5">5 séances par semaine</SelectItem>
                  <SelectItem value="6">6 séances par semaine</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Jours préférés */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Jours préférés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {days.map(day => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={day}
                      checked={localSettings.preferredDays.includes(day)}
                      onCheckedChange={() => handleDayToggle(day)}
                    />
                    <label htmlFor={day} className="text-sm font-medium">
                      {day}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Créneaux horaires */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Créneaux disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {timeSlots.map(slot => (
                  <div key={slot} className="flex items-center space-x-2">
                    <Checkbox
                      id={slot}
                      checked={localSettings.availableTimeSlots.includes(slot)}
                      onCheckedChange={() => handleTimeSlotToggle(slot)}
                    />
                    <label htmlFor={slot} className="text-sm font-medium">
                      {slot}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Intensité maximale */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Intensité maximale</CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={localSettings.maxIntensity} 
                onValueChange={(value) => setLocalSettings({ ...localSettings, maxIntensity: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {intensityLevels.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrainingSettings;
