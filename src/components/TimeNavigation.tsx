
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimeViewType } from './TimeViewSelector';

interface TimeNavigationProps {
  viewType: TimeViewType;
  currentDate: Date;
  onNavigate: (direction: 'prev' | 'next') => void;
  onReset: () => void;
}

const TimeNavigation: React.FC<TimeNavigationProps> = ({
  viewType,
  currentDate,
  onNavigate,
  onReset
}) => {
  const formatLabel = () => {
    switch (viewType) {
      case 'week':
        return 'Semaine courante';
      case 'month':
        return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      case '6months':
        const endDate = new Date(currentDate);
        endDate.setMonth(endDate.getMonth() + 6);
        return `${currentDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`;
      case 'year':
        return currentDate.getFullYear().toString();
      default:
        return '';
    }
  };

  const isCurrentPeriod = () => {
    const now = new Date();
    switch (viewType) {
      case 'week':
        // Check if current week
        const startOfWeek = new Date(currentDate);
        const dayOfWeek = startOfWeek.getDay();
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startOfWeek.setDate(startOfWeek.getDate() - mondayOffset);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        return now >= startOfWeek && now <= endOfWeek;
      case 'month':
        return now.getMonth() === currentDate.getMonth() && now.getFullYear() === currentDate.getFullYear();
      case '6months':
        const sixMonthsEnd = new Date(currentDate);
        sixMonthsEnd.setMonth(sixMonthsEnd.getMonth() + 6);
        return now >= currentDate && now <= sixMonthsEnd;
      case 'year':
        return now.getFullYear() === currentDate.getFullYear();
      default:
        return false;
    }
  };

  return (
    <div className="flex items-center gap-2 bg-gradient-performance text-white px-3 py-1 rounded-full text-sm font-medium">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate('prev')}
        className="h-6 w-6 p-0 text-white hover:bg-white/20 hover:text-white"
      >
        <ChevronLeft size={14} />
      </Button>
      
      <button
        onClick={onReset}
        className="px-2 py-1 rounded hover:bg-white/20 transition-colors min-w-[120px] text-center"
        title={isCurrentPeriod() ? "Période courante" : "Retourner à la période courante"}
      >
        {isCurrentPeriod() ? 
          (viewType === 'week' ? 'Semaine courante' : 'Période courante') : 
          formatLabel()
        }
      </button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate('next')}
        className="h-6 w-6 p-0 text-white hover:bg-white/20 hover:text-white"
      >
        <ChevronRight size={14} />
      </Button>
    </div>
  );
};

export default TimeNavigation;
