
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { weeklyData } from '../data/mockData';

const WeeklySummary = () => {
  const totalKm = weeklyData.reduce((sum, day) => sum + day.distance, 0);
  const averageDaily = totalKm / 7;
  const runningDays = weeklyData.filter(day => day.distance > 0).length;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 animate-scale-in">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Résumé Hebdomadaire</h2>
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
          +12% vs semaine précédente
        </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyData}>
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
