
import React from 'react';
import { Calendar, MapPin, Clock, Activity, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LastSessionData {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  start_date_local: string;
  average_heartrate: number | null;
  session_type: string | null;
  location_city: string | null;
}

interface AutoDetectedLastSessionProps {
  lastSession: LastSessionData | null;
  loading: boolean;
}

const AutoDetectedLastSession: React.FC<AutoDetectedLastSessionProps> = ({
  lastSession,
  loading
}) => {
  const formatDistance = (distance: number) => {
    return `${(distance / 1000).toFixed(2)} km`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes} min`;
  };

  const formatPace = (distance: number, timeSeconds: number) => {
    if (distance === 0) return '0:00';
    const paceSeconds = timeSeconds / (distance / 1000);
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.round(paceSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays <= 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getSessionTypeColor = (sessionType: string | null) => {
    if (!sessionType) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    const type = sessionType.toLowerCase();
    if (type.includes('interval') || type.includes('fractionn')) {
      return 'bg-red-100 text-red-800 border-red-200';
    } else if (type.includes('seuil') || type.includes('threshold')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    } else if (type.includes('endurance') || type.includes('fondamentale')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (type.includes('tempo')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    } else if (type.includes('côte') || type.includes('hill')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    } else if (type.includes('fartlek')) {
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    } else if (type.includes('récup') || type.includes('recovery')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-blue-200 rounded mb-3"></div>
            <div className="h-8 bg-blue-300 rounded mb-2"></div>
            <div className="h-4 bg-blue-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!lastSession) {
    return (
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
        <CardContent className="p-4 text-center">
          <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">Aucune séance récente trouvée</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Dernière séance</h3>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(lastSession.start_date_local)}</span>
          </div>
        </div>

        <div className="space-y-3">
          {/* Nom de la séance */}
          <div>
            <h4 className="font-medium text-gray-900 truncate" title={lastSession.name}>
              {lastSession.name}
            </h4>
            {lastSession.location_city && (
              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                <MapPin className="h-3 w-3" />
                <span>{lastSession.location_city}</span>
              </div>
            )}
          </div>

          {/* Métriques principales */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {formatDistance(lastSession.distance)}
              </div>
              <div className="text-xs text-gray-600">Distance</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {formatDuration(lastSession.moving_time)}
              </div>
              <div className="text-xs text-gray-600">Durée</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-indigo-600">
                {formatPace(lastSession.distance, lastSession.moving_time)}
              </div>
              <div className="text-xs text-gray-600">Allure</div>
            </div>
          </div>

          {/* Informations supplémentaires */}
          <div className="flex items-center justify-between pt-2 border-t border-blue-200">
            <div className="flex items-center gap-2">
              {lastSession.session_type && (
                <Badge className={getSessionTypeColor(lastSession.session_type)}>
                  {lastSession.session_type}
                </Badge>
              )}
              {lastSession.average_heartrate && (
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <Heart className="h-3 w-3" />
                  <span>{Math.round(lastSession.average_heartrate)} bpm</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoDetectedLastSession;
