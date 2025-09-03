
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import StravaStatus from '@/components/StravaStatus';

const Settings = () => {
  const { user } = useAuth();

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
              <CardTitle>Connexion Strava</CardTitle>
              <CardDescription>
                Connectez votre compte Strava pour synchroniser automatiquement vos activités
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StravaStatus mode="full" />
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
