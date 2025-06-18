
import { MapPin, Clock, RefreshCw } from 'lucide-react';
import { usePersonalRecords } from '@/hooks/usePersonalRecords';
import { useStravaData } from '@/hooks/useStravaData';
import { personalRecords } from '../data/mockData';
import { Button } from '@/components/ui/button';

const RecordsSlider = () => {
  const { records, loading, error, refetch } = usePersonalRecords();
  const { syncActivities, isStravaConnected } = useStravaData();

  // Utilise les vraies données Strava si disponibles, sinon les données mockées
  const currentRecords = (isStravaConnected && records.length > 0) ? records : personalRecords;

  const handleSync = async () => {
    await syncActivities();
    // Rafraîchir les records après la synchronisation
    setTimeout(() => {
      refetch();
    }, 1000);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 animate-scale-in">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-800">Records Personnels</h2>
          {isStravaConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Sync Strava
            </Button>
          )}
        </div>
        <span className="text-sm text-gray-600">
          {currentRecords.length} distance{currentRecords.length > 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading && isStravaConnected ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-running-blue"></div>
          <span className="ml-3 text-gray-600">Chargement des records...</span>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {currentRecords.map((record, index) => (
            <div 
              key={record.id}
              className={`min-w-64 bg-gradient-to-br ${
                record.isRecent 
                  ? 'from-orange-50 to-orange-100 border-l-4 border-running-orange' 
                  : 'from-gray-50 to-gray-100 border-l-4 border-gray-300'
              } rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="font-bold text-lg text-gray-800">{record.distance}</span>
                {record.isRecent && (
                  <span className="bg-running-orange text-white text-xs px-2 py-1 rounded-full">
                    Récent
                  </span>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-600" />
                  <span className="font-bold text-2xl text-running-blue">{record.time}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Allure: {record.pace}
                </div>
                <div className="flex items-start gap-2 mt-3">
                  <MapPin size={14} className="text-gray-500 mt-0.5" />
                  <div className="text-xs text-gray-500">
                    <div className="font-medium">{record.date}</div>
                    <div>{record.location}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isStravaConnected && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
          Connectez-vous à Strava pour voir vos records personnels réels
        </div>
      )}
    </div>
  );
};

export default RecordsSlider;
