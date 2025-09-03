
import { useEffect } from 'react';
import { toast } from 'sonner';
import StravaStatus from './StravaStatus';

const StravaConnect = () => {
  // Gérer les paramètres d'URL de retour de connexion
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stravaConnected = urlParams.get('strava_connected');
    const error = urlParams.get('error');

    if (stravaConnected === 'true') {
      toast.success('Compte Strava connecté avec succès ! Synchronisation automatique activée.');
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
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return <StravaStatus mode="status" size="sm" variant="ghost" />;
};

export default StravaConnect;
