
import React from 'react';
import { useMonthlyGridData } from '@/hooks/useMonthlyGridData';
import { Skeleton } from '@/components/ui/skeleton';

interface MonthGridViewProps {
  currentMonth: Date;
  onDayClick?: (date: string) => void;
}

const MonthGridView: React.FC<MonthGridViewProps> = ({ currentMonth, onDayClick }) => {
  const { stats, loading, error } = useMonthlyGridData(currentMonth);

  if (loading) {
    return (
      <div className="grid grid-cols-7 gap-1 h-32">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full rounded" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32 text-red-500 text-sm">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  const getIntensityColor = (distance: number) => {
    if (distance === 0) return 'bg-gray-100';
    if (distance < 5) return 'bg-blue-200';
    if (distance < 10) return 'bg-blue-400';
    if (distance < 15) return 'bg-blue-600';
    return 'bg-blue-800';
  };

  const getTextColor = (distance: number) => {
    if (distance === 0) return 'text-gray-400';
    if (distance < 10) return 'text-gray-700';
    return 'text-white';
  };

  return (
    <div className="space-y-2">
      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 text-xs font-medium text-gray-500">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(day => (
          <div key={day} className="text-center py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before month start */}
        {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() - 1 }).map((_, i) => (
          <div key={`empty-${i}`} className="h-6" />
        ))}

        {/* Days of the month */}
        {stats.gridData.map((day, index) => {
          const dayNumber = new Date(day.date).getDate();
          const isToday = new Date().toISOString().split('T')[0] === day.date;
          
          return (
            <button
              key={day.date}
              onClick={() => onDayClick?.(day.date)}
              className={`
                h-6 rounded text-xs font-medium transition-all duration-200 hover:scale-110
                ${getIntensityColor(day.distance)}
                ${getTextColor(day.distance)}
                ${isToday ? 'ring-2 ring-running-blue' : ''}
                ${day.distance > 0 ? 'cursor-pointer hover:opacity-80' : ''}
              `}
              title={`${dayNumber}/${currentMonth.getMonth() + 1}: ${day.distance} km${day.activitiesCount > 0 ? ` (${day.activitiesCount} séance${day.activitiesCount > 1 ? 's' : ''})` : ''}`}
            >
              {dayNumber}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-2">
        <span>Moins</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
          <div className="w-3 h-3 bg-blue-200 rounded-sm"></div>
          <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
          <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
          <div className="w-3 h-3 bg-blue-800 rounded-sm"></div>
        </div>
        <span>Plus</span>
      </div>
    </div>
  );
};

export default MonthGridView;
