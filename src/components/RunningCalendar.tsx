
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
    if (distance <= 5) return 'w-10 h-10 sm:w-8 sm:h-8';
    if (distance <= 10) return 'w-11 h-11 sm:w-9 sm:h-9';
    return 'w-12 h-12 sm:w-10 sm:h-10';
  };

  const getCompactCircleSize = (distance: number): string => {
    if (distance <= 5) return 'w-7 h-7 sm:w-6 sm:h-6';
    if (distance <= 10) return 'w-8 h-8 sm:w-7 sm:h-7';
    return 'w-9 h-9 sm:w-8 sm:h-8';
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-12 sm:h-10 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
      {/* Header compact */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">
          Calendrier des courses
        </h2>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={previousMonth}
            className="mobile-touch-target w-8 h-8 p-0 hover:bg-gray-100 rounded-lg"
            aria-label="Mois précédent"
          >
            <ChevronLeft size={16} />
          </Button>
          
          <span className="text-sm font-semibold text-gray-800 min-w-[100px] text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={nextMonth}
            className="mobile-touch-target w-8 h-8 p-0 hover:bg-gray-100 rounded-lg"
            aria-label="Mois suivant"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Calendar Grid compact */}
      <div className="space-y-2">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
            <div key={index} className="text-xs font-semibold text-gray-500 text-center py-1">
              <span className="sm:hidden">{day}</span>
              <span className="hidden sm:inline">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][index]}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar days compact */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month start */}
          {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, index) => (
            <div key={`empty-${index}`} className="h-9 sm:h-8"></div>
          ))}
          
          {/* Month days */}
          {days.map(day => {
            const year = day.getFullYear();
            const month = String(day.getMonth() + 1).padStart(2, '0');
            const dayNum = String(day.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${dayNum}`;
            
            const dayActivity = dailyActivities[dateKey];
            const isToday = new Date().toDateString() === day.toDateString();
            const dayNumber = format(day, 'd');
            
            return (
              <div key={dateKey} className="h-9 sm:h-8 flex items-center justify-center">
                {dayActivity ? (
                  <ActivityPopover activities={dayActivity.activities} date={dateKey}>
                    <button
                      className={`
                        rounded-full transition-all duration-200 flex items-center justify-center
                        hover:scale-110 hover:shadow-lg text-white font-semibold text-xs
                        mobile-touch-target active:scale-95 transform
                        ${getCompactCircleSize(dayActivity.totalDistance)}
                        ${getCircleColor(dayActivity.totalDistance)}
                        ${!isSameMonth(day, currentMonth) ? 'opacity-30' : ''}
                      `}
                      title={`${dayActivity.totalDistance.toFixed(1)} km`}
                    >
                      {dayNumber}
                    </button>
                  </ActivityPopover>
                ) : (
                  <div className={`
                    w-full h-full flex items-center justify-center rounded-lg text-xs font-medium
                    mobile-touch-target transition-colors duration-150
                    ${isToday ? 'bg-running-blue/10 text-running-blue font-bold' : 'text-gray-700 hover:bg-gray-50'}
                    ${!isSameMonth(day, currentMonth) ? 'text-gray-300' : ''}
                  `}>
                    {dayNumber}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend compact */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs text-gray-600 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-running-blue/30 flex items-center justify-center text-white font-semibold text-xs">
              1
            </div>
            <span>≤ 3km</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-running-blue/60 flex items-center justify-center text-white font-semibold text-xs">
              15
            </div>
            <span>3-7km</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-full bg-running-blue flex items-center justify-center text-white font-semibold text-xs">
              20
            </div>
            <span>≥ 12km</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RunningCalendar;
