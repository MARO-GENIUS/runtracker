
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useMonthlyRunningActivities } from '@/hooks/useMonthlyRunningActivities';
import ActivityPopover from './ActivityPopover';

const RunningCalendar = () => {
  const { dailyActivities, loading, currentMonth, setCurrentMonth } = useMonthlyRunningActivities();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getCircleSize = (distance: number): string => {
    if (distance <= 5) return 'w-2 h-2'; // 8px
    if (distance <= 10) return 'w-3 h-3'; // 12px
    return 'w-4 h-4'; // 16px
  };

  const getCircleColor = (distance: number): string => {
    if (distance <= 3) return 'bg-running-blue/30';
    if (distance <= 7) return 'bg-running-blue/60';
    if (distance <= 12) return 'bg-running-blue/80';
    return 'bg-running-blue';
  };

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Calendrier des courses
        </h2>
        
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={previousMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft size={16} />
          </Button>
          
          <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={nextMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="text-xs font-medium text-gray-500 text-center py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month start */}
          {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, index) => (
            <div key={`empty-${index}`} className="h-8"></div>
          ))}
          
          {/* Month days */}
          {days.map(day => {
            const dateKey = day.toISOString().split('T')[0];
            const dayActivity = dailyActivities[dateKey];
            const isToday = new Date().toDateString() === day.toDateString();
            
            return (
              <div key={dateKey} className="relative h-8 flex items-center justify-center">
                <div className={`
                  w-full h-full flex items-center justify-center rounded-md text-sm
                  ${isToday ? 'bg-running-blue/10 font-semibold text-running-blue' : 'text-gray-700'}
                  ${!isSameMonth(day, currentMonth) ? 'text-gray-300' : ''}
                `}>
                  {format(day, 'd')}
                </div>
                
                {/* Activity circle */}
                {dayActivity && (
                  <ActivityPopover activities={dayActivity.activities} date={dateKey}>
                    <button
                      className={`
                        absolute top-1 right-1 rounded-full transition-all duration-200
                        hover:scale-110 hover:shadow-sm
                        ${getCircleSize(dayActivity.totalDistance)}
                        ${getCircleColor(dayActivity.totalDistance)}
                      `}
                      title={`${dayActivity.totalDistance.toFixed(1)} km`}
                    />
                  </ActivityPopover>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-running-blue/30"></div>
            <span>≤ 3km</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-running-blue/60"></div>
            <span>3-7km</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-running-blue"></div>
            <span>≥ 12km</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RunningCalendar;
