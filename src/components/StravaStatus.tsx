import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, RefreshCw, Unlink, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useStravaData } from '@/hooks/useStravaData';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

interface StravaStatusProps {
  mode?: 'connect' | 'status' | 'full';
  size?: 'sm' | 'default';
  variant?: 'ghost' | 'outline' | 'default';
}

const StravaStatus = ({ 
  mode = 'status', 
  size = 'default',
  variant = 'ghost' 
}: StravaStatusProps) => {
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const { user } = useAuth();
  const { isStravaConnected, loading, syncActivities, isAutoSyncing } = useStravaData();

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

  const handleStravaDisconnect = async () => {
    if (!user) return;

    setDisconnecting(true);
    
    try {
      // Essayer de supprimer les tokens, mais ne pas échouer si ils n'existent pas
      const tokenResult = await supabase.functions.invoke('secure-token-manager', {
        body: { 
          action: 'delete_tokens',
          userId: user.id 
        }
      });

      // Log pour debug mais ne pas arrêter le processus
      if (tokenResult.error) {
        console.log('Token deletion result:', tokenResult.error);
      }

      // Nettoyer le profil utilisateur dans tous les cas
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          strava_user_id: null, 
          strava_expires_at: null 
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Erreur mise à jour profil:', profileError);
        // Continuer même si la mise à jour du profil échoue
      }

      toast.success('Compte Strava déconnecté avec succès');
      
      // Recharger la page pour mettre à jour l'état
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Erreur lors de la déconnexion Strava:', error);
      toast.error('Erreur lors de la déconnexion de Strava');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSync = async () => {
    try {
      await syncActivities();
      toast.success('Synchronisation lancée');
    } catch (error) {
      toast.error('Erreur lors de la synchronisation');
    }
  };

  // Simple Strava icon SVG
  const StravaIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-orange-600">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.172"/>
    </svg>
  );

  // Mode connect: Seulement le bouton de connexion
  if (mode === 'connect' && !isStravaConnected) {
    return (
      <Button 
        onClick={handleStravaConnect} 
        disabled={connecting}
        variant={variant}
        size={size}
        className="text-muted-foreground hover:text-orange-600 hover:bg-orange-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <StravaIcon />
          <span className="text-sm font-medium">Connecter Strava</span>
          <ExternalLink className="w-4 h-4" />
        </div>
      </Button>
    );
  }

  // Mode status: Affiche l'état et permet actions rapides
  if (mode === 'status') {
    if (!isStravaConnected) {
      return (
        <Button 
          onClick={handleStravaConnect} 
          disabled={connecting}
          variant="outline"
          size={size}
          className="text-muted-foreground hover:text-orange-600 hover:bg-orange-50 border-border"
        >
          <div className="flex items-center gap-2">
            <StravaIcon />
            <span className="text-sm">Connecter Strava</span>
          </div>
        </Button>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 hover:text-orange-800 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3" />
                <span className="text-sm font-medium">Strava connecté</span>
                <ChevronDown className="w-3 h-3" />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="end">
            <div className="space-y-1">
              <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                Actions Strava
              </div>
              <Separator />
              <Button
                onClick={handleSync}
                disabled={isAutoSyncing}
                variant="ghost"
                size="sm"
                className="w-full justify-start hover:bg-orange-50 hover:text-orange-700"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isAutoSyncing ? 'animate-spin' : ''}`} />
                {isAutoSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
              </Button>
              <Button
                onClick={handleStravaDisconnect}
                disabled={disconnecting}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Unlink className="w-4 h-4 mr-2" />
                {disconnecting ? 'Déconnexion...' : 'Déconnecter Strava'}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Mode full: Tous les contrôles (pour Settings)
  if (mode === 'full') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StravaIcon />
            <div>
              <h3 className="font-medium">Connexion Strava</h3>
              <p className="text-sm text-muted-foreground">
                {isStravaConnected 
                  ? 'Votre compte Strava est connecté et synchronisé' 
                  : 'Connectez votre compte Strava pour importer vos activités'
                }
              </p>
            </div>
          </div>
          <Badge 
            variant={isStravaConnected ? "secondary" : "outline"}
            className={isStravaConnected 
              ? "bg-green-50 text-green-700 border-green-200" 
              : "bg-gray-50 text-gray-600"
            }
          >
            {isStravaConnected ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Connecté
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 mr-1" />
                Déconnecté
              </>
            )}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          {isStravaConnected ? (
            <>
              <Button
                onClick={handleSync}
                disabled={isAutoSyncing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isAutoSyncing ? 'animate-spin' : ''}`} />
                {isAutoSyncing ? 'Synchronisation...' : 'Synchroniser'}
              </Button>
              <Button
                onClick={handleStravaDisconnect}
                disabled={disconnecting}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Unlink className="w-4 h-4 mr-2" />
                {disconnecting ? 'Déconnexion...' : 'Déconnecter'}
              </Button>
            </>
          ) : (
            <Button 
              onClick={handleStravaConnect} 
              disabled={connecting}
              variant="default"
              size="sm"
            >
              <StravaIcon />
              <span className="ml-2">
                {connecting ? 'Connexion...' : 'Connecter Strava'}
              </span>
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default StravaStatus;