
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Clock, MapPin } from 'lucide-react';
import { useStravaData } from '@/hooks/useStravaData';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import ActivitiesTable from './ActivitiesTable';

const ActivitiesView = () => {
  const { stats, loading, error, syncActivities, isStravaConnected } = useStravaData();
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh du composant quand les données changent
  useAutoRefresh({
    onRefresh: async () => {
      console.log('Auto-refresh des activités déclenché');
      // Le composant ActivitiesTable se rafraîchira automatiquement via ses propres hooks
    },
    dependencies: [isStravaConnected],
    enabled: isStravaConnected
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await syncActivities();
    setRefreshing(false);
  };

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
            <Button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Connecter Strava
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header avec statistiques rapides */}
      <div className="flex justify-between items-start">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-running-blue" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Ce mois</p>
                  <p className="text-2xl font-bold">{stats?.monthly?.distance || 0} km</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="text-green-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Activités</p>
                  <p className="text-2xl font-bold">{stats?.monthly?.activitiesCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MapPin className="text-purple-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Cette année</p>
                  <p className="text-2xl font-bold">{stats?.yearly?.distance || 0} km</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-orange-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Dernière course</p>
                  <p className="text-lg font-bold">
                    {stats?.latest ? `${stats.latest.distance} km` : 'Aucune'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Button 
          onClick={handleRefresh}
          disabled={loading || refreshing}
          variant="outline"
          className="ml-4"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
          Synchroniser
        </Button>
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
