
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const StravaConnect = () => {
  const [connecting, setConnecting] = useState(false);
  const { user } = useAuth();

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
