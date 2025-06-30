
import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, CalendarIcon, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface SchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (date: Date) => void;
  daysSinceLastActivity?: number;
}

const SchedulingModal = ({ isOpen, onClose, onSchedule, daysSinceLastActivity }: SchedulingModalProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();

  const handleSchedule = () => {
    if (selectedDate) {
      onSchedule(selectedDate);
      onClose();
    }
  };

  const suggestedDates = [
    { label: "Aujourd'hui", date: new Date() },
    { label: "Demain", date: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    { label: "Dans 2 jours", date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Planifier votre prochaine séance
          </DialogTitle>
          <DialogDescription>
            Quand prévoyez-vous de faire votre prochaine course ? Cette information permettra à l'IA d'adapter ses recommandations.
            {daysSinceLastActivity !== undefined && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg text-sm">
                <Clock className="h-4 w-4 inline mr-1" />
                Il s'est écoulé {daysSinceLastActivity} jour{daysSinceLastActivity > 1 ? 's' : ''} depuis votre dernière séance
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dates suggérées */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Suggestions rapides :</p>
            <div className="flex gap-2">
              {suggestedDates.map((suggestion) => (
                <Button
                  key={suggestion.label}
                  variant={selectedDate?.toDateString() === suggestion.date.toDateString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDate(suggestion.date)}
                  className="flex-1"
                >
                  {suggestion.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Sélecteur de date personnalisé */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Ou choisir une date précise :</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? 
                    format(selectedDate, "EEEE d MMMM yyyy", { locale: fr }) : 
                    "Sélectionner une date"
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  disabled={(date) => date < new Date(Date.now() - 24 * 60 * 60 * 1000)}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button 
              onClick={handleSchedule} 
              disabled={!selectedDate}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Analyser avec cette date
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SchedulingModal;
