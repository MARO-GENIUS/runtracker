
import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Edit3, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SchedulingModal from './SchedulingModal';

interface ScheduledDateManagerProps {
  scheduledDate?: string;
  onDateChange: (newDate: Date) => void;
  onReanalyze: () => void;
  isReanalyzing?: boolean;
}

const ScheduledDateManager = ({ 
  scheduledDate, 
  onDateChange, 
  onReanalyze, 
  isReanalyzing = false 
}: ScheduledDateManagerProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDateChange = (newDate: Date) => {
    onDateChange(newDate);
    onReanalyze();
  };

  const getDaysUntilDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyBadge = (daysUntil: number) => {
    if (daysUntil < 0) return { color: 'bg-red-100 text-red-800', text: 'En retard' };
    if (daysUntil === 0) return { color: 'bg-orange-100 text-orange-800', text: "Aujourd'hui" };
    if (daysUntil === 1) return { color: 'bg-yellow-100 text-yellow-800', text: 'Demain' };
    if (daysUntil <= 3) return { color: 'bg-blue-100 text-blue-800', text: `Dans ${daysUntil} jours` };
    return { color: 'bg-gray-100 text-gray-800', text: `Dans ${daysUntil} jours` };
  };

  if (!scheduledDate) return null;

  const daysUntil = getDaysUntilDate(scheduledDate);
  const urgencyBadge = getUrgencyBadge(daysUntil);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-blue-600" />
          <div>
            <p className="font-medium text-gray-900">
              Prochaine séance planifiée
            </p>
            <p className="text-sm text-gray-600">
              {format(new Date(scheduledDate), "EEEE d MMMM yyyy", { locale: fr })}
            </p>
          </div>
          <Badge className={urgencyBadge.color}>
            <Clock className="h-3 w-3 mr-1" />
            {urgencyBadge.text}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Edit3 className="h-4 w-4 mr-1" />
            Modifier
          </Button>
          
          {daysUntil < 0 && (
            <Button
              size="sm"
              onClick={onReanalyze}
              disabled={isReanalyzing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isReanalyzing ? 'animate-spin' : ''}`} />
              Re-analyser
            </Button>
          )}
        </div>
      </div>

      <SchedulingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSchedule={handleDateChange}
      />
    </div>
  );
};

export default ScheduledDateManager;
