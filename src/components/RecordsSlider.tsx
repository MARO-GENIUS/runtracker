
import { MapPin, Clock, ChevronRight, Trophy } from 'lucide-react';
import { useState } from 'react';
import { usePersonalRecords } from '@/hooks/usePersonalRecords';
import { useStravaData } from '@/hooks/useStravaData';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { personalRecords } from '../data/mockData';
import { Button } from '@/components/ui/button';
import DistanceHistoryPanel from '@/components/DistanceHistoryPanel';

const RecordsSlider = () => {
  const { records, loading, error, refetch } = usePersonalRecords();
  const { isStravaConnected } = useStravaData();
  const [selectedRecord, setSelectedRecord] = useState<{ distance: number; name: string } | null>(null);

  // Auto-refresh quand les données Strava sont synchronisées
  useAutoRefresh({
    onRefresh: refetch,
    dependencies: [isStravaConnected],
    enabled: isStravaConnected
  });

  // Utilise les vraies données Strava si disponibles, sinon les données mockées
  const currentRecords = (isStravaConnected && records.length > 0) ? records : personalRecords;


  const handleRecordClick = (record: any) => {
    let distanceInMeters: number;
    let distanceName: string;

    if (record.distanceMeters) {
      distanceInMeters = record.distanceMeters;
      distanceName = record.distance;
    } else {
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 animate-fade-in">
      {/* Header mobile optimisé */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-running-orange/10 p-2 rounded-lg">
            <Trophy className="h-5 w-5 text-running-orange" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Records Personnels
            </h2>
            <p className="text-sm text-gray-600">
              {currentRecords.length} distance{currentRecords.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && isStravaConnected ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-running-blue"></div>
          <span className="ml-3 text-sm text-gray-600">Chargement des records...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Layout mobile vertical avec cartes optimisées */}
          {currentRecords.map((record, index) => (
            <div 
              key={record.id}
              onClick={() => handleRecordClick(record)}
              className={`
                group relative overflow-hidden rounded-xl p-4 cursor-pointer
                transition-all duration-200 mobile-touch-target
                active:scale-98 hover:shadow-md
                ${record.isRecent 
                  ? 'bg-gradient-to-r from-orange-50 to-orange-100 border border-running-orange/20' 
                  : 'bg-gradient-to-r from-gray-50 to-white border border-gray-200'
                }
              `}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Badge récent */}
              {record.isRecent && (
                <div className="absolute top-3 right-3">
                  <span className="bg-running-orange text-white text-xs px-2 py-1 rounded-full font-medium">
                    Récent
                  </span>
                </div>
              )}
              
              {/* Contenu principal */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-bold text-white
                    ${record.isRecent ? 'bg-running-orange' : 'bg-running-blue'}
                  `}>
                    {record.distance.split(' ')[0]}
                  </div>
                  <div>
                    <div className="font-bold text-lg text-gray-900">
                      {record.distance}
                    </div>
                    <div className="text-sm text-gray-600">
                      {record.date}
                    </div>
                  </div>
                </div>
                
                <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-500" />
                  <div>
                    <div className="font-bold text-xl text-running-blue">{record.time}</div>
                    <div className="text-xs text-gray-600">Temps</div>
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{record.pace}</div>
                  <div className="text-xs text-gray-600">Allure moyenne</div>
                </div>
              </div>
              
              {/* Localisation */}
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-600 truncate">
                  {record.location}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isStravaConnected && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
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
