
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Unlink, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Settings = () => {
  const { user } = useAuth();
  const [isStravaConnected, setIsStravaConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Vérifier l'état de connexion Strava de manière simple
  useEffect(() => {
    const checkStravaConnection = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('strava_user_id, strava_expires_at')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking Strava connection:', error);
          setIsStravaConnected(false);
        } else {
          // Considérer comme connecté si on a un strava_user_id
          setIsStravaConnected(!!profile?.strava_user_id);
        }
      } catch (error) {
        console.error('Error checking Strava status:', error);
        setIsStravaConnected(false);
      } finally {
        setLoading(false);
      }
    };

    checkStravaConnection();
  }, [user]);

  const handleStravaConnect = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour lier votre compte Strava');
      return;
    }

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
    }
  };

  const handleStravaDisconnect = async () => {
    if (!user) return;

    try {
      // Supprimer les tokens de manière sécurisée
      const { error: tokenError } = await supabase.functions.invoke('secure-token-manager', {
        body: {
          action: 'delete_tokens',
          userId: user.id
        }
      });

      if (tokenError) {
        console.error('Erreur lors de la suppression des tokens:', tokenError);
      }

      // Nettoyer les informations Strava du profil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          strava_user_id: null,
          strava_expires_at: null
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast.success('Compte Strava déconnecté avec succès');
      
      // Rafraîchir la page pour mettre à jour l'état
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors de la déconnexion Strava:', error);
      toast.error('Erreur lors de la déconnexion de Strava');
    }
  };

  // Simple Strava icon SVG
  const StravaIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-orange-600">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.172"/>
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-600 mt-2">Gérez vos préférences et connexions</p>
        </div>

        <div className="space-y-6">
          {/* Section Strava */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <StravaIcon />
                Connexion Strava
              </CardTitle>
              <CardDescription>
                Connectez votre compte Strava pour synchroniser automatiquement vos activités de course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-gray-600">Vérification de l'état de connexion...</div>
              ) : isStravaConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Compte Strava connecté</span>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      Votre compte Strava est connecté et vos activités sont synchronisées automatiquement.
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleStravaDisconnect}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Unlink className="w-4 h-4" />
                    Déconnecter Strava
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-gray-600">
                    Connectez votre compte Strava pour synchroniser automatiquement vos activités de course.
                  </div>
                  
                  <Button
                    onClick={handleStravaConnect}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
                  >
                    <StravaIcon />
                    Connecter à Strava
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section Profil */}
          <Card>
            <CardHeader>
              <CardTitle>Profil utilisateur</CardTitle>
              <CardDescription>
                Informations de votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium text-gray-900">Email :</span>
                  <span className="ml-2 text-gray-600">{user?.email}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-gray-900">Membre depuis :</span>
                  <span className="ml-2 text-gray-600">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
