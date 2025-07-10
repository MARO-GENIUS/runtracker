
import { TrendingUp, Target, Calendar, Settings } from 'lucide-react';
import { useStravaData } from '@/hooks/useStravaData';
import { useMonthlyGoals } from '@/hooks/useMonthlyGoals';
import { monthlyStats } from '../data/mockData';
import { 
  getCurrentMonthName, 
  getDaysRemainingInMonth, 
  getDaysPassedInMonth,
  getDailyAverageNeeded,
  getProgressColor,
  getProgressBarColor
} from '@/utils/dateHelpers';
import { useState } from 'react';
import StravaMonthlyDashboard from './StravaMonthlyDashboard';

const MonthlyStats = () => {
  const { stats, loading, isStravaConnected } = useStravaData();
  const { currentGoal, updateGoal } = useMonthlyGoals();
  const [showGoalEdit, setShowGoalEdit] = useState(false);
  const [newGoal, setNewGoal] = useState(currentGoal);

  // Utilise les données Strava si disponibles, sinon les données mockées
  const currentMonthKm = stats?.monthly.distance || monthlyStats.currentMonth.km;
  const yearlyTotal = stats?.yearly.distance || monthlyStats.yearTotal;
  const monthlyActivities = stats?.monthly.activitiesCount || 0;
  const yearlyActivities = stats?.yearly.activitiesCount || 0;

  // Calculs dynamiques
  const progressPercentage = (currentMonthKm / currentGoal) * 100;
  const daysRemaining = getDaysRemainingInMonth();
  const daysPassed = getDaysPassedInMonth();
  const daysInMonth = daysPassed + daysRemaining;
  const daysPassedRatio = daysPassed / daysInMonth;
  const remainingKm = Math.max(0, currentGoal - currentMonthKm);
  const dailyAverageNeeded = getDailyAverageNeeded(remainingKm, daysRemaining);
  
  const monthlyGrowth = ((currentMonthKm - monthlyStats.previousMonth.km) / monthlyStats.previousMonth.km * 100);
  const yearlyGrowth = ((yearlyTotal - monthlyStats.previousYear) / monthlyStats.previousYear * 100);

  const handleGoalUpdate = async () => {
    await updateGoal(newGoal);
    setShowGoalEdit(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Tableau de bord Strava en haut */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <div className="h-16 bg-gray-200 rounded-xl mb-3"></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Autres statistiques */}
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Tableau de bord Strava en haut */}
      <StravaMonthlyDashboard />
      
      {/* Objectif mensuel - Layout mobile optimisé */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-running-green/10 p-2 rounded-lg">
              <Target className="text-running-green" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Objectif {getCurrentMonthName()}</h3>
              <p className="text-sm text-gray-600">{progressPercentage.toFixed(0)}% réalisé</p>
            </div>
          </div>
          <button
            onClick={() => {
              setNewGoal(currentGoal);
              setShowGoalEdit(!showGoalEdit);
            }}
            className="mobile-touch-target p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Settings size={16} className="text-gray-500" />
          </button>
        </div>
        
        {showGoalEdit ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={newGoal}
                onChange={(e) => setNewGoal(Number(e.target.value))}
                className="mobile-input w-24 text-center"
                min="1"
                max="1000"
              />
              <span className="text-gray-600 font-medium">km</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleGoalUpdate}
                className="bg-running-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-running-green/90 mobile-touch-target-sm"
              >
                Sauver
              </button>
              <button
                onClick={() => setShowGoalEdit(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 mobile-touch-target-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-end gap-3">
              <span className="text-3xl sm:text-4xl font-bold text-running-green">
                {currentMonthKm.toFixed(1)}
              </span>
              <span className="text-lg text-gray-600 mb-1">/ {currentGoal} km</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`bg-gradient-to-r ${getProgressBarColor(progressPercentage, daysPassedRatio)} h-3 rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className={`font-medium ${getProgressColor(progressPercentage, daysPassedRatio)}`}>
                {daysRemaining} jours restants
              </div>
              {remainingKm > 0 && (
                <div className="text-gray-600">
                  Moy. nécessaire: {dailyAverageNeeded.toFixed(1)} km/jour
                </div>
              )}
            </div>
            
            <div className="pt-3 border-t border-gray-100 text-sm">
              <span className={`font-medium ${isStravaConnected ? 'text-running-blue' : getProgressColor(progressPercentage, daysPassedRatio)}`}>
                {isStravaConnected ? `${monthlyActivities} activités ce mois` : `${monthlyGrowth >= 0 ? '+' : ''}${monthlyGrowth.toFixed(1)}% vs mois dernier`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Total annuel - Layout mobile optimisé */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-running-blue/10 p-2 rounded-lg">
            <Calendar className="text-running-blue" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Total 2024</h3>
            <p className="text-sm text-gray-600">{isStravaConnected ? `${yearlyActivities} activités` : 'Cette année'}</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <span className="text-3xl sm:text-4xl font-bold text-running-blue">
              {yearlyTotal.toLocaleString()}
            </span>
            <span className="text-lg text-gray-600 mb-1">km</span>
          </div>
          
          <div className={`flex items-center gap-2 text-sm font-medium ${yearlyGrowth >= 0 ? 'text-running-green' : 'text-red-500'}`}>
            <TrendingUp size={16} />
            {isStravaConnected ? 'Données Strava' : `${yearlyGrowth >= 0 ? '+' : ''}${yearlyGrowth.toFixed(1)}% d'amélioration`}
          </div>
        </div>
      </div>

      {/* Dernière activité - Mobile optimisé */}
      {(isStravaConnected && stats?.latest) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-running-purple/10 p-2 rounded-lg">
              <TrendingUp className="text-running-purple" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Dernière Activité</h3>
              <p className="text-sm text-gray-600">{new Date(stats.latest.date).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl">
            <div className="text-2xl font-bold">{stats.latest.distance} km</div>
            <div className="text-sm opacity-90 truncate mt-1">{stats.latest.name}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyStats;
