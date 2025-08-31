
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { weeklyData } from '../data/mockData';
import { useOptimizedStravaData } from '@/hooks/useOptimizedStravaData';
import { useWeeklyRunningActivities } from '@/hooks/useWeeklyRunningActivities';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { Button } from '@/components/ui/button';

import WeekSelector from './WeekSelector';

const WeeklySummary = () => {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const { isStravaConnected } = useOptimizedStravaData();
  const { stats: weeklyStats, loading: weeklyLoading, error: weeklyError, refetch } = useWeeklyRunningActivities({ 
    weekDate: selectedWeek 
  });
  
  // Auto-refresh quand les données Strava sont synchronisées
  useAutoRefresh({
    onRefresh: refetch,
    dependencies: [isStravaConnected, selectedWeek],
    enabled: isStravaConnected
  });
  
  // Utilise les vraies données Strava si disponibles, sinon les données mockées
  const currentWeeklyData = (isStravaConnected && weeklyStats) ? weeklyStats.weeklyData : weeklyData;
  const totalKm = (isStravaConnected && weeklyStats) ? weeklyStats.totalKm : weeklyData.reduce((sum, day) => sum + day.distance, 0);
  const averageDaily = (isStravaConnected && weeklyStats) ? weeklyStats.averageDaily : totalKm / 7;
  const runningDays = (isStravaConnected && weeklyStats) ? weeklyStats.runningDays : weeklyData.filter(day => day.distance > 0).length;


  const handleWeekChange = (newWeek: Date) => {
    setSelectedWeek(newWeek);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 animate-fade-in">
      {/* Header compact */}
      <div className="mb-4">
        <div className="flex flex-col gap-3">
          {/* Titre */}
          <h2 className="text-lg font-bold text-gray-900">
            Résumé Hebdomadaire
          </h2>
          
          {/* Stats principales compactes */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-bold text-running-blue">
                  {totalKm.toFixed(1)}
                </span>
                <span className="text-base text-gray-600">km</span>
              </div>
              <div className="space-y-0.5">
                <div className="text-xs text-gray-600">
                  {averageDaily.toFixed(1)} km/jour en moyenne
                </div>
                <div className="text-xs text-gray-600">
                  {runningDays} jour{runningDays > 1 ? 's' : ''} de course
                </div>
              </div>
            </div>
            
            {/* Sélecteur de semaine */}
            <div className="flex justify-center sm:justify-end">
              <WeekSelector 
                currentWeek={selectedWeek}
                onWeekChange={handleWeekChange}
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

      {/* Graphique compact */}
      <div className="h-36 sm:h-40 w-full">
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
      </div>
    </div>
  );
};

export default WeeklySummary;
