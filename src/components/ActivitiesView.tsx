import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Clock, MapPin } from 'lucide-react';
import { useStravaData } from '@/hooks/useStravaData';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import ActivitiesTable from './ActivitiesTable';

const ActivitiesView = () => {
  const { stats, error, isStravaConnected } = useStravaData();

  // Auto-refresh du composant quand les données changent
  useAutoRefresh({
    onRefresh: async () => {
      console.log('Auto-refresh des activités déclenché');
      // Le composant ActivitiesTable se rafraîchira automatiquement via ses propres hooks
    },
    dependencies: [isStravaConnected],
    enabled: isStravaConnected
  });

  if (!isStravaConnected) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-xl">Connectez Strava pour voir vos performances</CardTitle>
            <CardDescription>
              Vous devez connecter votre compte Strava pour visualiser vos activités de course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Utilisez le bouton de connexion Strava dans l'en-tête de la page pour commencer.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mobile-container mobile-section-spacing space-y-4 sm:space-y-6">
      {/* Header avec statistiques rapides - Responsive */}
      <div className="space-y-4">

        {/* Grille de statistiques responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="mobile-card-spacing">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-running-blue flex-shrink-0" size={18} />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 mobile-text-hierarchy">Ce mois</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stats?.monthly?.distance || 0} km</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mobile-card-spacing">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Clock className="text-green-600 flex-shrink-0" size={18} />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 mobile-text-hierarchy">Activités</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats?.monthly?.activitiesCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mobile-card-spacing">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <MapPin className="text-purple-600 flex-shrink-0" size={18} />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 mobile-text-hierarchy">Cette année</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stats?.yearly?.distance || 0} km</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mobile-card-spacing">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-orange-600 flex-shrink-0" size={18} />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 mobile-text-hierarchy">Dernière</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 truncate">
                    {stats?.latest ? `${stats.latest.distance} km` : 'Aucune'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Tableau des activités */}
      <ActivitiesTable />
    </div>
  );
};

export default ActivitiesView;
