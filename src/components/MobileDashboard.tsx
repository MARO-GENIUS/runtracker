
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Clock, MapPin, Target, Calendar, Trophy, Activity } from 'lucide-react';
import { useStravaData } from '@/hooks/useStravaData';
import { useMonthlyGoals } from '@/hooks/useMonthlyGoals';
import { Link } from 'react-router-dom';

const MobileDashboard = () => {
  const { stats, loading } = useStravaData();
  const { currentGoal } = useMonthlyGoals();
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'recent'>('overview');

  const quickStats = [
    {
      title: 'Cette semaine',
      value: `${stats?.weekly?.distance || 0} km`,
      icon: TrendingUp,
      color: 'text-running-blue bg-running-blue/10',
      change: '+12%'
    },
    {
      title: 'Ce mois',
      value: `${stats?.monthly?.activitiesCount || 0} courses`,
      icon: Activity,
      color: 'text-running-green bg-running-green/10',
      change: '+8%'
    },
    {
      title: 'Temps total',
      value: `${Math.round((stats?.monthly?.movingTime || 0) / 3600)}h`,
      icon: Clock,
      color: 'text-running-purple bg-running-purple/10',
      change: '+15%'
    },
    {
      title: 'Objectif mensuel',
      value: `${Math.round(((stats?.monthly?.distance || 0) / (currentGoal?.goal_km || 100)) * 100)}%`,
      icon: Target,
      color: 'text-running-orange bg-running-orange/10',
      change: 'En cours'
    }
  ];

  const recentActivities = stats?.recent?.slice(0, 3) || [];

  if (loading) {
    return (
      <div className="mobile-section-spacing space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-running-blue mx-auto mb-4"></div>
          <p className="mobile-text-hierarchy text-gray-600">Chargement de vos données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-section-spacing space-y-6 max-w-md mx-auto">
      {/* En-tête de bienvenue */}
      <div className="text-center mb-6">
        <h1 className="mobile-title text-gray-900 mb-2">
          Bonjour, Coureur ! 👋
        </h1>
        <p className="mobile-text-hierarchy text-gray-600">
          Voici votre résumé de performances
        </p>
      </div>

      {/* Navigation par onglets mobile */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
        {[
          { id: 'overview', label: 'Vue d\'ensemble', icon: TrendingUp },
          { id: 'goals', label: 'Objectifs', icon: Target },
          { id: 'recent', label: 'Récent', icon: Clock }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium mobile-smooth-transition ${
              activeTab === tab.id
                ? 'bg-white text-running-blue shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Contenu selon l'onglet actif */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Statistiques rapides en grille 2x2 */}
          <div className="mobile-grid-2 gap-4">
            {quickStats.map((stat, index) => (
              <Card key={index} className="mobile-card-modern border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${stat.color}`}>
                      <stat.icon size={20} />
                    </div>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      {stat.change}
                    </span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-600">
                      {stat.title}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions rapides */}
          <Card className="mobile-card-modern border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="mobile-subtitle">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <Link to="/activities">
                  <Button className="w-full mobile-button-enhanced bg-running-blue hover:bg-running-blue/90">
                    <Activity className="mr-2" size={18} />
                    Voir mes performances
                  </Button>
                </Link>
                <Link to="/coach">
                  <Button variant="outline" className="w-full mobile-button-enhanced">
                    <Target className="mr-2" size={18} />
                    Coach IA
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'goals' && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Progression de l'objectif mensuel */}
          <Card className="mobile-card-modern border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="mobile-subtitle flex items-center gap-2">
                <Target className="text-running-orange" size={20} />
                Objectif ce mois-ci
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Progression</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {stats?.monthly?.distance || 0} km / {currentGoal?.goal_km || 100} km
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-running-blue to-running-green h-3 rounded-full mobile-smooth-transition"
                      style={{ 
                        width: `${Math.min(((stats?.monthly?.distance || 0) / (currentGoal?.goal_km || 100)) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Reste à parcourir</p>
                  <p className="text-xl font-bold text-gray-900">
                    {Math.max((currentGoal?.goal_km || 100) - (stats?.monthly?.distance || 0), 0)} km
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Objectifs de la semaine */}
          <Card className="mobile-card-modern border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="mobile-subtitle">Cette semaine</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">3 courses complétées</span>
                  </div>
                  <Trophy className="text-green-600" size={16} />
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">{stats?.weekly?.distance || 0} km parcourus</span>
                  </div>
                  <MapPin className="text-blue-600" size={16} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'recent' && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Activités récentes */}
          <Card className="mobile-card-modern border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="mobile-subtitle">Dernières courses</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1 text-sm">
                          {activity.name}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>{activity.distance} km</span>
                          <span>{activity.duration}</span>
                          <span>{activity.pace}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {activity.date}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="mx-auto mb-4 text-gray-400" size={48} />
                    <p className="text-gray-600 mobile-text-hierarchy">
                      Aucune activité récente
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bouton pour voir toutes les activités */}
          <Link to="/activities">
            <Button variant="outline" className="w-full mobile-button-enhanced">
              <Calendar className="mr-2" size={18} />
              Voir toutes mes performances
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default MobileDashboard;
