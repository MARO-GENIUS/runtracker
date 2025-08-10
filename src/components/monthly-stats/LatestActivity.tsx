
import { TrendingUp } from 'lucide-react';

interface LatestActivityData {
  date: string;
  distance: number;
  name: string;
}

interface LatestActivityProps {
  latestActivity: LatestActivityData | null;
}

export const LatestActivity = ({ latestActivity }: LatestActivityProps) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-running-purple/10 p-2 rounded-lg">
          <TrendingUp className="text-running-purple" size={20} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Dernière Activité</h3>
          <p className="text-sm text-gray-600">
            {latestActivity?.date ? new Date(latestActivity.date).toLocaleDateString('fr-FR') : '—'}
          </p>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl">
        <div className="text-2xl font-bold">{latestActivity ? `${latestActivity.distance} km` : '—'}</div>
        <div className="text-sm opacity-90 truncate mt-1">{latestActivity ? latestActivity.name : 'Aucune course récente'}</div>
      </div>
    </div>
  );
};
