import { MapPin, Clock, ChevronRight, Trophy } from 'lucide-react';
import { useState } from 'react';
import { usePersonalRecords } from '@/hooks/usePersonalRecords';
import { useStravaData } from '@/hooks/useStravaData';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { personalRecords } from '../data/mockData';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
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
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && isStravaConnected ? (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-running-blue"></div>
          <span className="ml-3 text-sm text-gray-600">Chargement des records...</span>
        </div>
      ) : (
        <div className="relative">
          <Carousel 
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-1 md:-ml-2">
              {currentRecords.map((record, index) => (
                <CarouselItem key={record.id} className="pl-1 md:pl-2 basis-full sm:basis-1/2 lg:basis-1/3">
                  <div 
                    onClick={() => handleRecordClick(record)}
                    className={`
                      group relative overflow-hidden rounded-xl p-3 cursor-pointer h-full
                      transition-all duration-300 mobile-touch-target
                      active:scale-[0.98] hover:shadow-lg hover:-translate-y-1
                      ${record.isRecent 
                        ? 'bg-gradient-to-br from-orange-50 via-white to-orange-50/50 border-2 border-running-orange/20' 
                        : 'bg-gradient-to-br from-gray-50 via-white to-gray-50/30 border border-gray-200 hover:border-gray-300'
                      }
                    `}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* En-tête avec badges */}
                    <div className="flex items-center justify-between mb-2">
                      <div className={`
                        inline-flex items-center px-2.5 py-1 rounded-full font-bold text-sm
                        ${record.isRecent 
                          ? 'bg-gradient-to-r from-running-orange to-orange-600 text-white shadow-lg' 
                          : 'bg-gradient-to-r from-running-blue to-blue-600 text-white shadow-md'
                        }
                      `}>
                        {record.distance}
                      </div>
                      
                      {record.isRecent && (
                        <div className="bg-running-orange text-white text-xs px-2 py-0.5 rounded-full font-medium shadow-sm">
                          ✨ Récent
                        </div>
                      )}
                    </div>
                    
                    {/* Information principale - Temps centré */}
                    <div className="text-center mb-2">
                      <div className="font-bold text-xl sm:text-2xl text-running-blue mb-0.5 tracking-tight">
                        {record.time}
                      </div>
                      <div className="flex items-center justify-center gap-1.5 text-sm text-gray-600">
                        <Clock size={13} className="text-running-orange" />
                        <span className="font-medium">{record.pace}</span>
                      </div>
                    </div>
                    
                    {/* Pied avec contexte */}
                    <div className="border-t border-gray-100 pt-2 mt-auto">
                      {/* Date et navigation */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm text-gray-700 font-medium">
                          {record.date}
                        </div>
                        <ChevronRight size={16} className="text-gray-400 group-hover:text-running-blue transition-colors duration-200" />
                      </div>
                      
                      {/* Localisation */}
                      <div className="flex items-start gap-1.5">
                        <MapPin size={13} className="text-running-orange mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-gray-600 truncate leading-relaxed">
                          {record.location}
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Navigation du carrousel */}
            <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border-gray-200 hover:border-gray-300 shadow-lg" />
            <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border-gray-200 hover:border-gray-300 shadow-lg" />
          </Carousel>
        </div>
      )}

      {!isStravaConnected && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
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
