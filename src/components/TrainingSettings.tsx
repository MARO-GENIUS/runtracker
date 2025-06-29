
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Settings, Target, Calendar, Clock } from 'lucide-react';

interface TrainingSettings {
  targetRace: 'recuperation' | '5k' | '10k' | 'semi' | 'marathon';
  targetDate?: Date;
  weeklyFrequency: number;
  preferredDays: string[];
  availableTimeSlots: string[];
  maxIntensity: 'low' | 'medium' | 'high';
}

interface TrainingSettingsProps {
  settings: TrainingSettings;
  onUpdateSettings: (settings: TrainingSettings) => void;
}

const TrainingSettings = ({ settings, onUpdateSettings }: TrainingSettingsProps) => {
  const [localSettings, setLocalSettings] = useState<TrainingSettings>(settings);
  const [isOpen, setIsOpen] = useState(false);

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

  const handleSave = () => {
    onUpdateSettings(localSettings);
    setIsOpen(false);
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
                onValueChange={(value) => setLocalSettings({ ...localSettings, targetRace: value as any })}
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

          {/* Fréquence d'entraînement */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
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
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Sauvegarder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrainingSettings;
