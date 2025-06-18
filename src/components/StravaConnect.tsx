
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Activity, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useStravaData } from '@/hooks/useStravaData';

const StravaConnect = () => {
  const [connecting, setConnecting] = useState(false);
  const { user } = useAuth();
  const { isStravaConnected, syncActivities, loading, stats } = useStravaData();

  useEffect(() => {
    // Check URL parameters for connection status
    const urlParams = new URLSearchParams(window.location.search);
    const stravaConnected = urlParams.get('strava_connected');
    const error = urlParams.get('error');

    if (stravaConnected === 'true') {
      toast.success('Compte Strava connecté avec succès !');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      let errorMessage = 'Erreur lors de la connexion à Strava';
      switch (error) {
        case 'strava_denied':
          errorMessage = 'Connexion Strava annulée';
          break;
        case 'missing_params':
          errorMessage = 'Paramètres manquants dans la réponse Strava';
          break;
        case 'config_error':
          errorMessage = 'Configuration Strava incorrecte';
          break;
        case 'token_exchange_failed':
          errorMessage = 'Échec de l\'échange de tokens avec Strava';
          break;
        case 'storage_failed':
          errorMessage = 'Erreur lors de la sauvegarde des données Strava';
          break;
        case 'callback_error':
          errorMessage = 'Erreur dans le processus de connexion Strava';
          break;
      }
      toast.error(errorMessage);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleStravaConnect = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour lier votre compte Strava');
      return;
    }

    setConnecting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('strava-oauth', {
        body: { action: 'get_auth_url' }
      });

      if (error) throw error;

      if (data?.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (error) {
      console.error('Erreur lors de la connexion Strava:', error);
      toast.error('Erreur lors de la connexion à Strava');
    } finally {
      setConnecting(false);
    }
  };

  if (isStravaConnected) {
    return (
      <div className="space-y-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="text-green-600" size={32} />
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-green-800">Strava Connecté</CardTitle>
            <CardDescription>
              Votre compte Strava est connecté et vos activités peuvent être synchronisées
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={syncActivities}
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Synchronisation...' : 'Synchroniser les activités'}
            </Button>
            
            {stats && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div>
                    <span className="text-gray-600">Ce mois:</span>
                    <div className="font-semibold">{stats.monthly.distance} km</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Cette année:</span>
                    <div className="font-semibold">{stats.yearly.distance} km</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-orange-100 p-3 rounded-full">
            <Activity className="text-orange-600" size={32} />
          </div>
        </div>
        <CardTitle className="text-xl font-bold">Connecter Strava</CardTitle>
        <CardDescription>
          Liez votre compte Strava pour synchroniser automatiquement vos activités de course
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleStravaConnect} 
          disabled={connecting}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
        >
          <ExternalLink className="mr-2" size={16} />
          {connecting ? 'Connexion...' : 'Connecter avec Strava'}
        </Button>
        <p className="text-xs text-gray-500 mt-4 text-center">
          Vos données restent privées et sécurisées
        </p>
      </CardContent>
    </Card>
  );
};

export default StravaConnect;
