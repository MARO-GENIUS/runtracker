
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Clock, 
  MapPin, 
  Calendar,
  ChevronDown,
  SlidersHorizontal
} from 'lucide-react';
import { useActivities } from '@/hooks/useActivities';
import { formatDistance, formatDuration, formatPace, formatDate } from '@/utils/activityHelpers';

const MobileActivitiesView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'start_date' | 'distance' | 'moving_time'>('start_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);

  const { activities, loading, error } = useActivities({
    page: 1,
    limit: 50,
    sortBy,
    sortOrder,
    searchTerm
  });

  const handleSort = (column: 'start_date' | 'distance' | 'moving_time') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSortLabel = () => {
    const labels = {
      start_date: 'Date',
      distance: 'Distance',
      moving_time: 'Durée'
    };
    return `${labels[sortBy]} ${sortOrder === 'desc' ? '↓' : '↑'}`;
  };

  if (loading) {
    return (
      <div className="mobile-section-spacing">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-running-blue mx-auto mb-4"></div>
          <p className="mobile-text-hierarchy text-gray-600">Chargement de vos performances...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-section-spacing">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <p className="text-red-700 mb-4">{error}</p>
            <Button variant="outline" size="sm">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mobile-section-spacing space-y-4 max-w-md mx-auto">
      {/* Header avec statistiques rapides */}
      <div className="mb-6">
        <div className="mobile-grid-3 gap-3 mb-4">
          <div className="text-center bg-white rounded-xl p-3 shadow-sm">
            <p className="text-2xl font-bold text-running-blue">{activities.length}</p>
            <p className="text-xs text-gray-600">Courses</p>
          </div>
          <div className="text-center bg-white rounded-xl p-3 shadow-sm">
            <p className="text-2xl font-bold text-running-green">
              {activities.reduce((sum, a) => sum + a.distance, 0).toFixed(0)}
            </p>
            <p className="text-xs text-gray-600">km Total</p>
          </div>
          <div className="text-center bg-white rounded-xl p-3 shadow-sm">
            <p className="text-2xl font-bold text-running-purple">
              {Math.round(activities.reduce((sum, a) => sum + a.moving_time, 0) / 3600)}
            </p>
            <p className="text-xs text-gray-600">Heures</p>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Rechercher une course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mobile-input-enhanced pl-10 pr-4"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 mobile-button-spacing"
          >
            <SlidersHorizontal size={16} className="mr-2" />
            Trier: {getSortLabel()}
            <ChevronDown 
              size={16} 
              className={`ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} 
            />
          </Button>
        </div>

        {/* Options de tri */}
        {showFilters && (
          <div className="bg-white rounded-xl p-4 shadow-sm border animate-slide-in-up">
            <p className="font-medium text-gray-900 mb-3 text-sm">Trier par:</p>
            <div className="space-y-2">
              {[
                { key: 'start_date', label: 'Date', icon: Calendar },
                { key: 'distance', label: 'Distance', icon: MapPin },
                { key: 'moving_time', label: 'Durée', icon: Clock }
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => handleSort(option.key as any)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-sm mobile-smooth-transition ${
                    sortBy === option.key
                      ? 'bg-running-blue/10 text-running-blue font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <option.icon size={16} />
                    <span>{option.label}</span>
                  </div>
                  {sortBy === option.key && (
                    <span className="text-xs">
                      {sortOrder === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Liste des activités */}
      <div className="space-y-3">
        {activities.length === 0 ? (
          <Card className="mobile-card-modern text-center py-12">
            <TrendingUp size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="mobile-subtitle text-gray-700 mb-2">Aucune activité trouvée</h3>
            <p className="mobile-text-hierarchy text-gray-600">
              {searchTerm ? 'Aucune activité ne correspond à votre recherche.' : 'Vos courses synchronisées apparaîtront ici.'}
            </p>
            {searchTerm && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSearchTerm('')}
                className="mt-4"
              >
                Effacer la recherche
              </Button>
            )}
          </Card>
        ) : (
          activities.map((activity) => (
            <Card 
              key={activity.id} 
              className="mobile-card-modern cursor-pointer hover:shadow-md mobile-smooth-transition"
              onClick={() => setSelectedActivity(selectedActivity === activity.id ? null : activity.id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight flex-1 pr-2">
                    {activity.name}
                  </h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(activity.start_date_local)}
                  </span>
                </div>
                
                <div className="mobile-grid-3 gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-running-blue/10 rounded-lg flex items-center justify-center">
                      <MapPin size={14} className="text-running-blue" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Distance</p>
                      <p className="font-semibold text-sm text-gray-900">
                        {formatDistance(activity.distance)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-running-green/10 rounded-lg flex items-center justify-center">
                      <Clock size={14} className="text-running-green" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Temps</p>
                      <p className="font-semibold text-sm text-gray-900">
                        {formatDuration(activity.moving_time)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-running-purple/10 rounded-lg flex items-center justify-center">
                      <TrendingUp size={14} className="text-running-purple" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Allure</p>
                      <p className="font-semibold text-sm text-gray-900">
                        {formatPace(activity.distance, activity.moving_time)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Détails étendus */}
                {selectedActivity === activity.id && (
                  <div className="pt-3 border-t border-gray-100 animate-fade-in-up">
                    <div className="space-y-2 text-sm">
                      {activity.total_elevation_gain && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dénivelé:</span>
                          <span className="font-medium">{activity.total_elevation_gain}m</span>
                        </div>
                      )}
                      {activity.average_heartrate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">FC moyenne:</span>
                          <span className="font-medium">{Math.round(activity.average_heartrate)} bpm</span>
                        </div>
                      )}
                      {activity.calories && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Calories:</span>
                          <span className="font-medium">{activity.calories} kcal</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MobileActivitiesView;
