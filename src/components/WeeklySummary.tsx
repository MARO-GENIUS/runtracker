
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { weeklyData } from '../data/mockData';
import { useStravaData } from '@/hooks/useStravaData';
import { useWeeklyRunningActivities } from '@/hooks/useWeeklyRunningActivities';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useMonthlyGridData } from '@/hooks/useMonthlyGridData';
import { useSixMonthsData } from '@/hooks/useSixMonthsData';
import { useYearlyData } from '@/hooks/useYearlyData';

import TimeViewSelector, { TimeViewType } from './TimeViewSelector';
import TimeNavigation from './TimeNavigation';
import MonthGridView from './views/MonthGridView';
import SixMonthsView from './views/SixMonthsView';
import YearlyView from './views/YearlyView';

const WeeklySummary = () => {
  const [viewType, setViewType] = useState<TimeViewType>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { isStravaConnected } = useStravaData();
  const { stats: weeklyStats, loading: weeklyLoading, error: weeklyError, refetch } = useWeeklyRunningActivities({ 
    weekDate: viewType === 'week' ? currentDate : undefined
  });
  
  const { stats: monthlyStats, loading: monthlyLoading } = useMonthlyGridData(
    viewType === 'month' ? currentDate : new Date()
  );
  
  const { stats: sixMonthsStats, loading: sixMonthsLoading } = useSixMonthsData(
    viewType === '6months' ? currentDate : new Date()
  );
  
  const { stats: yearlyStats, loading: yearlyLoading } = useYearlyData(
    viewType === 'year' ? currentDate.getFullYear() : new Date().getFullYear()
  );

  // Auto-refresh quand les données Strava sont synchronisées
  useAutoRefresh({
    onRefresh: refetch,
    dependencies: [isStravaConnected, currentDate, viewType],
    enabled: isStravaConnected && viewType === 'week'
  });

  const handleNavigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewType) {
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case '6months':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 6 : -6));
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const handleReset = () => {
    setCurrentDate(new Date());
  };

  const handleViewChange = (newView: TimeViewType) => {
    setViewType(newView);
    setCurrentDate(new Date()); // Reset to current date when changing view
  };

  // Get current stats based on view type
  const getCurrentStats = () => {
    switch (viewType) {
      case 'week':
        return isStravaConnected && weeklyStats ? {
          totalKm: weeklyStats.totalKm,
          averageDaily: weeklyStats.averageDaily,
          activeDays: weeklyStats.runningDays,
          label: 'km/jour en moyenne'
        } : {
          totalKm: weeklyData.reduce((sum, day) => sum + day.distance, 0),
          averageDaily: weeklyData.reduce((sum, day) => sum + day.distance, 0) / 7,
          activeDays: weeklyData.filter(day => day.distance > 0).length,
          label: 'km/jour en moyenne'
        };
      case 'month':
        return monthlyStats ? {
          totalKm: monthlyStats.totalKm,
          averageDaily: monthlyStats.averageDaily,
          activeDays: monthlyStats.runningDays,
          label: 'km/jour en moyenne'
        } : { totalKm: 0, averageDaily: 0, activeDays: 0, label: 'km/jour en moyenne' };
      case '6months':
        return sixMonthsStats ? {
          totalKm: sixMonthsStats.totalKm,
          averageDaily: sixMonthsStats.averageWeekly,
          activeDays: sixMonthsStats.activeWeeks,
          label: 'km/semaine en moyenne'
        } : { totalKm: 0, averageDaily: 0, activeDays: 0, label: 'km/semaine en moyenne' };
      case 'year':
        return yearlyStats ? {
          totalKm: yearlyStats.totalKm,
          averageDaily: yearlyStats.averageMonthly,
          activeDays: yearlyStats.activeMonths,
          label: 'km/mois en moyenne'
        } : { totalKm: 0, averageDaily: 0, activeDays: 0, label: 'km/mois en moyenne' };
      default:
        return { totalKm: 0, averageDaily: 0, activeDays: 0, label: 'km/jour en moyenne' };
    }
  };

  const currentStats = getCurrentStats();
  const isLoading = weeklyLoading || monthlyLoading || sixMonthsLoading || yearlyLoading;

  const renderChart = () => {
    switch (viewType) {
      case 'week':
        const currentWeeklyData = (isStravaConnected && weeklyStats) ? weeklyStats.weeklyData : weeklyData;
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={currentWeeklyData} 
              margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
            >
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                interval={0}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                width={32}
              />
              <Tooltip 
                formatter={(value: number) => [`${value} km`, 'Distance']}
                labelStyle={{ color: '#374151', fontSize: '13px', fontWeight: '500' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  fontSize: '13px'
                }}
              />
              <Bar 
                dataKey="distance" 
                fill="url(#gradientBar)"
                radius={[6, 6, 0, 0]}
              />
              <defs>
                <linearGradient id="gradientBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'month':
        return <MonthGridView currentMonth={currentDate} />;
      case '6months':
        return <SixMonthsView startDate={currentDate} />;
      case 'year':
        return <YearlyView year={currentDate.getFullYear()} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 animate-fade-in">
      {/* Header compact */}
      <div className="mb-4">
        <div className="flex flex-col gap-3">
          {/* Titre et sélecteur */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Résumé {viewType === 'week' ? 'Hebdomadaire' : 
                     viewType === 'month' ? 'Mensuel' : 
                     viewType === '6months' ? '6 Mois' : 'Annuel'}
            </h2>
            <TimeViewSelector value={viewType} onChange={handleViewChange} />
          </div>
          
          {/* Stats principales compactes */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold text-running-blue">
                  {currentStats.totalKm.toFixed(1)}
                </span>
                <span className="text-base text-gray-600">km</span>
              </div>
              <div className="space-y-0.5">
                <div className="text-xs text-gray-600">
                  {currentStats.averageDaily.toFixed(1)} {currentStats.label}
                </div>
                <div className="text-xs text-gray-600">
                  {currentStats.activeDays} {
                    viewType === 'week' ? `jour${currentStats.activeDays > 1 ? 's' : ''} de course` :
                    viewType === 'month' ? `jour${currentStats.activeDays > 1 ? 's' : ''} de course` :
                    viewType === '6months' ? `semaine${currentStats.activeDays > 1 ? 's' : ''} active${currentStats.activeDays > 1 ? 's' : ''}` :
                    `mois actif${currentStats.activeDays > 1 ? 's' : ''}`
                  }
                </div>
              </div>
            </div>
            
            {/* Navigation */}
            <div className="flex justify-center sm:justify-end">
              <TimeNavigation 
                viewType={viewType}
                currentDate={currentDate}
                onNavigate={handleNavigate}
                onReset={handleReset}
              />
            </div>
          </div>
        </div>
      </div>

      {weeklyError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {weeklyError}
        </div>
      )}

      {/* Graphique avec animation */}
      <div className="h-36 sm:h-40 w-full transition-all duration-300 animate-fade-in">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-running-blue"></div>
          </div>
        ) : (
          renderChart()
        )}
      </div>
    </div>
  );
};

export default WeeklySummary;
