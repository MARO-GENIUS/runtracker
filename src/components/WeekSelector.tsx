
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WeekSelectorProps {
  currentWeek: Date;
  onWeekChange: (newWeek: Date) => void;
}

const WeekSelector: React.FC<WeekSelectorProps> = ({ currentWeek, onWeekChange }) => {
  const getWeekBounds = (date: Date) => {
    const dayOfWeek = date.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - mondayOffset);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return { startOfWeek, endOfWeek };
  };

  const formatWeekRange = (date: Date) => {
    const { startOfWeek, endOfWeek } = getWeekBounds(date);
    
    const startMonth = startOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const endMonth = endOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    
    // Si même mois, afficher "1-7 jan", sinon "28 déc - 3 jan"
    if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
      return `${startOfWeek.getDate()}-${endOfWeek.getDate()} ${startOfWeek.toLocaleDateString('fr-FR', { month: 'short' })}`;
    } else {
      return `${startMonth} - ${endMonth}`;
    }
  };

  const isCurrentWeek = (date: Date) => {
    const now = new Date();
    const { startOfWeek, endOfWeek } = getWeekBounds(date);
    return now >= startOfWeek && now <= endOfWeek;
  };

  const goToPreviousWeek = () => {
    const previousWeek = new Date(currentWeek);
    previousWeek.setDate(currentWeek.getDate() - 7);
    onWeekChange(previousWeek);
  };

  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeek);
    nextWeek.setDate(currentWeek.getDate() + 7);
    onWeekChange(nextWeek);
  };

  const goToCurrentWeek = () => {
    onWeekChange(new Date());
  };

  return (
    <div className="flex items-center gap-2 bg-gradient-performance text-white px-3 py-1 rounded-full text-sm font-medium">
      <Button
        variant="ghost"
        size="sm"
        onClick={goToPreviousWeek}
        className="h-6 w-6 p-0 text-white hover:bg-white/20 hover:text-white"
      >
        <ChevronLeft size={14} />
      </Button>
      
      <button
        onClick={goToCurrentWeek}
        className="px-2 py-1 rounded hover:bg-white/20 transition-colors min-w-[120px] text-center"
        title={isCurrentWeek(currentWeek) ? "Semaine courante" : "Retourner à la semaine courante"}
      >
        {isCurrentWeek(currentWeek) ? "Semaine courante" : formatWeekRange(currentWeek)}
      </button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={goToNextWeek}
        className="h-6 w-6 p-0 text-white hover:bg-white/20 hover:text-white"
      >
        <ChevronRight size={14} />
      </Button>
    </div>
  );
};

export default WeekSelector;
