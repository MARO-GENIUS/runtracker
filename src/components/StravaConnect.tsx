
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useStravaData } from '@/hooks/useStravaData';

const StravaConnect = () => {
  const [connecting, setConnecting] = useState(false);
  const { user } = useAuth();
  const { isStravaConnected, stats, isAutoSyncing } = useStravaData();

  useEffect(() => {
    // Check URL parameters for connection status
    const urlParams = new URLSearchParams(window.location.search);
    const stravaConnected = urlParams.get('strava_connected');
    const error = urlParams.get('error');

    if (stravaConnected === 'true') {
      toast.success('Compte Strava connecté avec succès ! Synchronisation automatique activée.');
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

  // Simple Strava icon SVG
  const StravaIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-orange-600">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.172"/>
    </svg>
  );

  if (isStravaConnected) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            <StravaIcon />
            <span className="font-medium text-gray-700">Strava</span>
          </div>
          
          {isAutoSyncing ? (
            <div className="flex items-center gap-1 text-orange-600">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600"></div>
              <span className="text-xs">Synchronisation...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs">Synchronisé</span>
            </div>
          )}
        </div>
        
        {stats && (
          <div className="text-xs text-gray-500">
            <span>{stats.monthly.distance.toFixed(1)} km ce mois</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Button 
      onClick={handleStravaConnect} 
      disabled={connecting}
      variant="ghost"
      size="sm"
      className="h-auto p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <StravaIcon />
        <span className="text-sm font-medium">Connecter Strava</span>
        <ExternalLink className="w-4 h-4" />
      </div>
    </Button>
  );
};

export default StravaConnect;
