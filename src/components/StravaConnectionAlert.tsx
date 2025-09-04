import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import StravaStatus from './StravaStatus';
import { useStravaData } from '@/hooks/useStravaData';

const StravaConnectionAlert = () => {
  const { isStravaConnected, loading } = useStravaData();

  // N'afficher l'alerte que si Strava n'est pas connecté
  if (loading || isStravaConnected) {
    return null;
  }

  return (
    <Alert className="border-amber-200 bg-amber-50/50 text-amber-800">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1 mr-4">
          <span className="font-medium">Connexion Strava requise</span>
          <p className="text-sm text-amber-700 mt-1">
            Reconnectez votre compte Strava pour synchroniser vos activités et voir vos données à jour.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StravaStatus mode="connect" size="sm" variant="default" />
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default StravaConnectionAlert;