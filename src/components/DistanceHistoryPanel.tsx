
import { Clock, MapPin, TrendingUp, TrendingDown, Activity, X } from 'lucide-react';
import { useDistanceHistory } from '@/hooks/useDistanceHistory';
import { formatTimeFromSeconds, formatDate, formatDistanceType } from '@/utils/activityHelpers';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface DistanceHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  distance: number;
  distanceName: string;
}

const DistanceHistoryPanel = ({ isOpen, onClose, distance, distanceName }: DistanceHistoryPanelProps) => {
  const { history, loading, error } = useDistanceHistory(distance);

  const getBestTime = () => {
    if (history.length === 0) return null;
    return Math.min(...history.map(h => h.moving_time));
  };

  const getAverageTime = () => {
    if (history.length === 0) return null;
    const total = history.reduce((sum, h) => sum + h.moving_time, 0);
    return total / history.length;
  };

  const getTotalRuns = () => history.length;

  const getImprovementIcon = (improvement?: number) => {
    if (!improvement || improvement === 0) return null;
    if (improvement > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    }
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const formatImprovement = (improvement?: number) => {
    if (!improvement || improvement === 0) return '';
    const absImprovement = Math.abs(improvement);
    const sign = improvement > 0 ? '-' : '+';
    return `${sign}${formatTimeFromSeconds(absImprovement)}`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:w-[400px] lg:w-[540px] max-w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold text-gray-800">
            Historique {distanceName}
          </SheetTitle>
          <SheetDescription>
            Toutes vos performances sur cette distance
          </SheetDescription>
        </SheetHeader>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-running-blue"></div>
            <span className="ml-3 text-gray-600">Chargement de l'historique...</span>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Statistiques responsive */}
            {history.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-xs sm:text-sm text-gray-600 mobile-text-hierarchy">Record</div>
                  <div className="text-base sm:text-lg font-bold text-running-blue mobile-text-readable">
                    {formatTimeFromSeconds(getBestTime()!)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs sm:text-sm text-gray-600 mobile-text-hierarchy">Moyenne</div>
                  <div className="text-base sm:text-lg font-bold text-gray-800 mobile-text-readable">
                    {formatTimeFromSeconds(Math.round(getAverageTime()!))}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs sm:text-sm text-gray-600 mobile-text-hierarchy">Total</div>
                  <div className="text-base sm:text-lg font-bold text-gray-800 mobile-text-readable">
                    {getTotalRuns()} course{getTotalRuns() > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            )}

            {/* Timeline des performances */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Timeline des performances</h3>
              
              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Aucune performance trouvée pour cette distance</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto mobile-scroll-smooth">
                  {history.map((item, index) => (
                    <div 
                      key={item.id}
                      className={`flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border mobile-smooth-transition hover:shadow-md ${
                        item.moving_time === getBestTime() 
                          ? 'bg-green-50 border-green-200 border-l-4 border-l-green-500' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                          item.moving_time === getBestTime() ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        {index < history.length - 1 && (
                          <div className="w-0.5 h-6 sm:h-8 bg-gray-200 mt-1 sm:mt-2" />
                        )}
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                            <Clock size={14} className="text-gray-600 flex-shrink-0" />
                            <span className="font-bold text-base sm:text-lg text-running-blue mobile-text-readable">
                              {formatTimeFromSeconds(item.moving_time)}
                            </span>
                            {getImprovementIcon(item.improvement)}
                            {item.improvement !== 0 && (
                              <span className={`text-xs sm:text-sm ${
                                item.improvement! > 0 ? 'text-green-600' : 'text-red-500'
                              } hidden sm:inline`}>
                                {formatImprovement(item.improvement)}
                              </span>
                            )}
                          </div>
                          {item.moving_time === getBestTime() && (
                            <span className="bg-green-500 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex-shrink-0">
                              Record
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
                          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
                            <MapPin size={12} className="sm:hidden" />
                            <MapPin size={14} className="hidden sm:block" />
                            <span className="mobile-text-hierarchy">{formatDate(item.start_date_local)}</span>
                          </div>
                          {item.activity_name && (
                            <div className="text-xs sm:text-sm text-gray-500 truncate mobile-text-hierarchy">
                              {item.activity_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default DistanceHistoryPanel;
