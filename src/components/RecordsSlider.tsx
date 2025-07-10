import { MapPin, Clock, RefreshCw, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { usePersonalRecords } from '@/hooks/usePersonalRecords';
import { useStravaData } from '@/hooks/useStravaData';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { personalRecords } from '../data/mockData';
import { Button } from '@/components/ui/button';
import DistanceHistoryPanel from '@/components/DistanceHistoryPanel';

const RecordsSlider = () => {
  const { records, loading, error, refetch } = usePersonalRecords();
  const { syncActivities, isStravaConnected } = useStravaData();
  const [selectedRecord, setSelectedRecord] = useState<{ distance: number; name: string } | null>(null);

  // Auto-refresh quand les données Strava sont synchronisées
  useAutoRefresh({
    onRefresh: refetch,
    dependencies: [isStravaConnected],
    enabled: isStravaConnected
  });

  // Utilise les vraies données Strava si disponibles, sinon les données mockées
  const currentRecords = (isStravaConnected && records.length > 0) ? records : personalRecords;

  const handleSync = async () => {
    await syncActivities();
    // Rafraîchir les records après la synchronisation
    setTimeout(() => {
      refetch();
    }, 1000);
  };

  const handleRecordClick = (record: any) => {
    // Utiliser directement distanceMeters si disponible (données réelles Strava)
    // Sinon utiliser le mapping pour les données mockées
    let distanceInMeters: number;
    let distanceName: string;

    if (record.distanceMeters) {
      // Données réelles Strava - utiliser directement la distance en mètres
      distanceInMeters = record.distanceMeters;
      distanceName = record.distance;
    } else {
      // Données mockées - utiliser le mapping existant
      const distanceMap: { [key: string]: number } = {
        '400m': 400,
        '800m': 800,
        '1 km': 1000,
        '1 mile': 1609,
        '5 km': 5000,
        '10 km': 10000,
        '21,1 km': 21097,
        '42,2 km': 42195
      };
      
      distanceInMeters = distanceMap[record.distance];
      distanceName = record.distance;
    }

    if (distanceInMeters) {
      setSelectedRecord({
        distance: distanceInMeters,
        name: distanceName
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg mobile-card animate-scale-in">
      {/* Header mobile-first */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Records Personnels</h2>
          {isStravaConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={loading}
              className="mobile-button w-fit"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Strava</span>
              <span className="sm:hidden">Sync</span>
            </Button>
          )}
        </div>
        <span className="text-sm text-gray-600 mobile-text-hierarchy">
          {currentRecords.length} distance{currentRecords.length > 1 ? 's' : ''}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 mobile-text-hierarchy">
          {error}
        </div>
      )}

      {loading && isStravaConnected ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-running-blue"></div>
          <span className="ml-3 text-gray-600 mobile-text-hierarchy">Chargement des records...</span>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-0">
          {/* Mobile: Cartes empilées verticalement */}
          <div className="block sm:hidden space-y-3">
            {currentRecords.map((record, index) => (
              <div 
                key={record.id}
                onClick={() => handleRecordClick(record)}
                className={`bg-gradient-to-br p-4 rounded-xl shadow-sm border transition-all duration-200 cursor-pointer mobile-touch-target active:scale-98 ${
                  record.isRecent 
                    ? 'from-orange-50 to-orange-100 border-running-orange/30' 
                    : 'from-gray-50 to-gray-100 border-gray-200'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-gray-800">{record.distance}</span>
                    {record.isRecent && (
                      <span className="bg-running-orange text-white text-xs px-2 py-1 rounded-full">
                        Récent
                      </span>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-600" />
                    <span className="font-bold text-xl text-running-blue">{record.time}</span>
                  </div>
                  <div className="mobile-text-hierarchy text-gray-600">
                    Allure: {record.pace}
                  </div>
                  <div className="flex items-start gap-2 mt-2">
                    <MapPin size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-gray-500 mobile-text-hierarchy">
                      <div className="font-medium">{record.date}</div>
                      <div className="truncate">{record.location}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Slider horizontal */}
          <div className="hidden sm:flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {currentRecords.map((record, index) => (
              <div 
                key={record.id}
                onClick={() => handleRecordClick(record)}
                className={`min-w-64 bg-gradient-to-br rounded-lg p-4 hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer transform active:scale-95 ${
                  record.isRecent 
                    ? 'from-orange-50 to-orange-100 border-l-4 border-running-orange' 
                    : 'from-gray-50 to-gray-100 border-l-4 border-gray-300'
                }`}
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

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-running-blue font-medium hover:text-running-orange transition-colors">
                    Cliquez pour voir l'historique →
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isStravaConnected && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 mobile-text-hierarchy">
          Connectez-vous à Strava pour voir vos records personnels réels
        </div>
      )}

      {/* Panneau d'historique */}
      <DistanceHistoryPanel
        isOpen={selectedRecord !== null}
        onClose={() => setSelectedRecord(null)}
        distance={selectedRecord?.distance || 0}
        distanceName={selectedRecord?.name || ''}
      />
    </div>
  );
};

export default RecordsSlider;
