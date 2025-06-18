
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { weeklyData } from '../data/mockData';
import { useStravaData } from '@/hooks/useStravaData';
import { useWeeklyRunningActivities } from '@/hooks/useWeeklyRunningActivities';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const WeeklySummary = () => {
  const { syncActivities, isStravaConnected } = useStravaData();
  const { stats: weeklyStats, loading: weeklyLoading, error: weeklyError, refetch } = useWeeklyRunningActivities();
  
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 animate-scale-in">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-gray-800">Résumé Hebdomadaire</h2>
            {isStravaConnected && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={weeklyLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${weeklyLoading ? 'animate-spin' : ''}`} />
                Sync Strava
              </Button>
            )}
          </div>
          <div className="flex gap-6">
            <div>
              <span className="text-3xl font-bold text-running-blue">{totalKm.toFixed(1)}</span>
              <span className="text-gray-600 ml-1">km</span>
            </div>
            <div className="text-sm text-gray-600">
              <div>{averageDaily.toFixed(1)} km/jour en moyenne</div>
              <div>{runningDays} jour{runningDays > 1 ? 's' : ''} de course</div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-performance text-white px-3 py-1 rounded-full text-sm font-medium">
          {isStravaConnected ? 'Semaine courante' : 'Données d\'exemple'}
        </div>
      </div>

      {weeklyError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {weeklyError}
        </div>
      )}

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={currentWeeklyData}>
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <Tooltip 
              formatter={(value: number) => [`${value} km`, 'Distance']}
              labelStyle={{ color: '#374151' }}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
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
