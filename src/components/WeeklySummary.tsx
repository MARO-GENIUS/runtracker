
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { weeklyData } from '../data/mockData';
import { useStravaData } from '@/hooks/useStravaData';
import { useWeeklyRunningActivities } from '@/hooks/useWeeklyRunningActivities';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import WeekSelector from './WeekSelector';

const WeeklySummary = () => {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const { syncActivities, isStravaConnected } = useStravaData();
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

  const handleSync = async () => {
    await syncActivities();
    // Rafraîchir les données hebdomadaires après la synchronisation
    setTimeout(() => {
      refetch();
    }, 1000);
  };

  const handleWeekChange = (newWeek: Date) => {
    setSelectedWeek(newWeek);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg mobile-card animate-scale-in">
      {/* Header mobile-first */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">Résumé Hebdomadaire</h2>
              {isStravaConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={weeklyLoading}
                  className="mobile-button w-fit"
                >
                  <RefreshCw className={`h-4 w-4 ${weeklyLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Sync Strava</span>
                  <span className="sm:hidden">Sync</span>
                </Button>
              )}
            </div>
            
            {/* Stats principales - Layout mobile optimisé */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-running-blue">{totalKm.toFixed(1)}</span>
                <span className="text-gray-600">km</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="mobile-text-hierarchy">{averageDaily.toFixed(1)} km/jour en moyenne</div>
                <div className="mobile-text-hierarchy">{runningDays} jour{runningDays > 1 ? 's' : ''} de course</div>
              </div>
            </div>
          </div>
          
          {/* Sélecteur de semaine - Responsive */}
          <div className="flex justify-center sm:justify-end">
            <WeekSelector 
              currentWeek={selectedWeek}
              onWeekChange={handleWeekChange}
            />
          </div>
        </div>
      </div>

      {weeklyError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 mobile-text-hierarchy">
          {weeklyError}
        </div>
      )}

      {/* Graphique responsive - Hauteur adaptée mobile */}
      <div className="h-40 sm:h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={currentWeeklyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              interval={0}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              width={30}
            />
            <Tooltip 
              formatter={(value: number) => [`${value} km`, 'Distance']}
              labelStyle={{ color: '#374151', fontSize: '14px' }}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                fontSize: '14px'
              }}
            />
            <Bar 
              dataKey="distance" 
              fill="url(#gradientBar)"
              radius={[4, 4, 0, 0]}
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
