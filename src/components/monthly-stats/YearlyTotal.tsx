
import { Calendar, TrendingUp } from 'lucide-react';

interface YearlyTotalProps {
  yearlyTotal: number;
  yearlyActivities: number;
  yearlyGrowth: number;
  isStravaConnected: boolean;
}

export const YearlyTotal = ({ yearlyTotal, yearlyActivities, yearlyGrowth, isStravaConnected }: YearlyTotalProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-running-blue/10 p-2 rounded-lg">
          <Calendar className="text-running-blue" size={20} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Total {currentYear}</h3>
          <p className="text-sm text-gray-600">{isStravaConnected ? `${yearlyActivities} activités` : 'Cette année'}</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-end gap-2">
          <span className="text-3xl sm:text-4xl font-bold text-running-blue">
            {yearlyTotal.toLocaleString()}
          </span>
          <span className="text-lg text-gray-600 mb-1">km</span>
        </div>
        
        <div className={`flex items-center gap-2 text-sm font-medium ${yearlyGrowth >= 0 ? 'text-running-green' : 'text-red-500'}`}>
          <TrendingUp size={16} />
          {isStravaConnected ? 'Données Strava' : `${yearlyGrowth >= 0 ? '+' : ''}${yearlyGrowth.toFixed(1)}% d'amélioration`}
        </div>
      </div>
    </div>
  );
};
