
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
    if (distance <= 5) return 'w-8 h-8 sm:w-6 sm:h-6'; // Plus grand sur mobile
    if (distance <= 10) return 'w-9 h-9 sm:w-7 sm:h-7';
    return 'w-10 h-10 sm:w-8 sm:h-8';
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
      <div className="bg-white rounded-lg border border-gray-200 mobile-card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-10 sm:h-8 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 mobile-card">
      {/* Header - Mobile optimisé */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">
          Calendrier des courses
        </h2>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={previousMonth}
            className="mobile-touch-target-sm w-8 h-8 p-0 hover:bg-gray-100"
            aria-label="Mois précédent"
          >
            <ChevronLeft size={16} />
          </Button>
          
          <span className="text-sm sm:text-base font-medium text-gray-700 min-w-[100px] sm:min-w-[120px] text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={nextMonth}
            className="mobile-touch-target-sm w-8 h-8 p-0 hover:bg-gray-100"
            aria-label="Mois suivant"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Calendar Grid - Optimisé mobile */}
      <div className="space-y-2 sm:space-y-1">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
            <div key={index} className="text-xs font-medium text-gray-500 text-center py-2 mobile-text-hierarchy">
              <span className="sm:hidden">{day}</span>
              <span className="hidden sm:inline">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][index]}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar days - Espacement mobile optimisé */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1">
          {/* Empty cells for days before month start */}
          {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, index) => (
            <div key={`empty-${index}`} className="h-10 sm:h-8"></div>
          ))}
          
          {/* Month days */}
          {days.map(day => {
            // Generate date key using the same method as in the hook
            const year = day.getFullYear();
            const month = String(day.getMonth() + 1).padStart(2, '0');
            const dayNum = String(day.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${dayNum}`;
            
            const dayActivity = dailyActivities[dateKey];
            const isToday = new Date().toDateString() === day.toDateString();
            const dayNumber = format(day, 'd');
            
            return (
              <div key={dateKey} className="h-10 sm:h-8 flex items-center justify-center">
                {dayActivity ? (
                  <ActivityPopover activities={dayActivity.activities} date={dateKey}>
                    <button
                      className={`
                        rounded-full transition-all duration-200 flex items-center justify-center
                        hover:scale-110 hover:shadow-md text-white font-medium text-xs
                        mobile-touch-target-sm active:scale-95
                        ${getCircleSize(dayActivity.totalDistance)}
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
                    w-full h-full flex items-center justify-center rounded-md text-xs sm:text-sm
                    mobile-touch-target-sm
                    ${isToday ? 'bg-running-blue/10 font-semibold text-running-blue' : 'text-gray-700 hover:bg-gray-50'}
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

      {/* Legend - Mobile responsive */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-center gap-3 sm:gap-6 text-xs text-gray-500 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-running-blue/30 flex items-center justify-center text-white font-medium text-xs">1</div>
            <span className="mobile-text-hierarchy">≤ 3km</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-running-blue/60 flex items-center justify-center text-white font-medium text-xs">15</div>
            <span className="mobile-text-hierarchy">3-7km</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-running-blue flex items-center justify-center text-white font-medium text-xs">20</div>
            <span className="mobile-text-hierarchy">≥ 12km</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RunningCalendar;
