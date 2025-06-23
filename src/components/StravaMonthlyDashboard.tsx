
import { Clock, MapPin, Calendar } from 'lucide-react';
import { useStravaData } from '@/hooks/useStravaData';
import { getCurrentMonthName } from '@/utils/dateHelpers';

const StravaMonthlyDashboard = () => {
  const { stats, loading, isStravaConnected, isAutoSyncing, lastSyncTime } = useStravaData();

  // Conversion de la durée en heures et minutes
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Jamais';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours > 0) {
      return `Il y a ${diffHours}h`;
    } else if (diffMinutes > 0) {
      return `Il y a ${diffMinutes}min`;
    } else {
      return 'À l\'instant';
    }
  };

  if (!isStravaConnected) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Données Strava - {getCurrentMonthName()}
          </h3>
          <p className="text-gray-600 mb-4">
            Connectez votre compte Strava pour voir vos statistiques réelles
          </p>
        </div>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-strava-orange/10 p-2 rounded-lg">
            <Calendar className="text-strava-orange" size={20} />
          </div>
          <h3 className="font-semibold text-gray-800">
            Données Strava - {getCurrentMonthName()}
          </h3>
        </div>
        
        {/* Indicateur de synchronisation automatique */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {isAutoSyncing ? (
            <div className="flex items-center gap-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-strava-orange"></div>
              <span>Synchronisation...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Synchronisation auto</span>
            </div>
          )}
        </div>
      </div>

      {/* Affichage des statistiques ou message si aucune donnée */}
      {!stats || (stats.monthly.distance === 0 && stats.monthly.activitiesCount === 0) ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            {isAutoSyncing ? 'Chargement des données en cours...' : 'Aucune activité trouvée pour ce mois'}
          </p>
          {isAutoSyncing && (
            <div className="flex items-center justify-center gap-2 text-strava-orange">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-strava-orange"></div>
              <span className="text-sm">Synchronisation automatique...</span>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Distance totale */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-running-green to-running-green-light p-4 rounded-xl text-white mb-3">
                <div className="text-2xl font-bold">
                  {stats.monthly.distance?.toFixed(1) || '0'} km
                </div>
                <div className="text-sm opacity-90">Distance parcourue</div>
              </div>
            </div>

            {/* Nombre d'activités */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-running-blue to-blue-400 p-4 rounded-xl text-white mb-3">
                <div className="text-2xl font-bold">
                  {stats.monthly.activitiesCount || 0}
                </div>
                <div className="text-sm opacity-90">Activités</div>
              </div>
            </div>

            {/* Durée totale */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-running-purple to-purple-400 p-4 rounded-xl text-white mb-3">
                <div className="text-2xl font-bold">
                  {stats.monthly.duration ? formatDuration(stats.monthly.duration) : '0h 0min'}
                </div>
                <div className="text-sm opacity-90">Temps total</div>
              </div>
            </div>
          </div>

          {/* Activité la plus longue */}
          {stats.monthly.longestActivity && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={16} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Plus longue sortie du mois</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="font-semibold text-gray-800">
                  {stats.monthly.longestActivity.distance} km
                </div>
                <div className="text-sm text-gray-600 truncate">
                  {stats.monthly.longestActivity.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(stats.monthly.longestActivity.date).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Informations de synchronisation */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Synchronisation automatique toutes les 6h</span>
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>Dernière sync: {formatLastSync(lastSyncTime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StravaMonthlyDashboard;
