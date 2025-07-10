
import StravaMonthlyDashboard from '../StravaMonthlyDashboard';

export const MonthlyStatsLoading = () => {
  return (
    <div className="space-y-4">
      {/* Tableau de bord Strava en haut */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <div className="h-16 bg-gray-200 rounded-xl mb-3"></div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Autres statistiques */}
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
