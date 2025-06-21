
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      {/* Objectif mensuel dynamique */}
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-running-green/10 p-2 rounded-lg">
              <Target className="text-running-green" size={20} />
            </div>
            <h3 className="font-semibold text-gray-800">Objectif {getCurrentMonthName()}</h3>
          </div>
          <button
            onClick={() => {
              setNewGoal(currentGoal);
              setShowGoalEdit(!showGoalEdit);
            }}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Settings size={16} className="text-gray-500" />
          </button>
        </div>
        
        {showGoalEdit ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={newGoal}
                onChange={(e) => setNewGoal(Number(e.target.value))}
                className="border rounded px-2 py-1 w-20 text-center"
                min="1"
                max="1000"
              />
              <span className="text-gray-600">km</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleGoalUpdate}
                className="bg-running-green text-white px-3 py-1 rounded text-sm hover:bg-running-green/90"
              >
                Sauver
              </button>
              <button
                onClick={() => setShowGoalEdit(false)}
                className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-2xl font-bold text-running-green">
                {currentMonthKm.toFixed(1)}
              </span>
              <span className="text-gray-600">/ {currentGoal} km</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`bg-gradient-to-r ${getProgressBarColor(progressPercentage, daysPassedRatio)} h-3 rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{progressPercentage.toFixed(0)}% réalisé</span>
                <span className={`font-medium ${getProgressColor(progressPercentage, daysPassedRatio)}`}>
                  {daysRemaining} jours restants
                </span>
              </div>
              
              {remainingKm > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Reste: {remainingKm.toFixed(1)} km</span>
                  <span className="text-gray-500">
                    Moy. nécessaire: {dailyAverageNeeded.toFixed(1)} km/jour
                  </span>
                </div>
              )}
              
              <div className="text-sm">
                <span className={`font-medium ${isStravaConnected ? 'text-running-blue' : getProgressColor(progressPercentage, daysPassedRatio)}`}>
                  {isStravaConnected ? `${monthlyActivities} activités ce mois` : `${monthlyGrowth >= 0 ? '+' : ''}${monthlyGrowth.toFixed(1)}% vs mois dernier`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Total annuel */}
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-running-blue/10 p-2 rounded-lg">
            <Calendar className="text-running-blue" size={20} />
          </div>
          <h3 className="font-semibold text-gray-800">Total 2024</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-running-blue">
              {yearlyTotal.toLocaleString()}
            </span>
            <span className="text-gray-600">km</span>
          </div>
          
          <div className="text-sm text-gray-600">
            {isStravaConnected ? `${yearlyActivities} activités cette année` : `vs 2023: ${monthlyStats.previousYear.toLocaleString()} km`}
          </div>
          
          <div className={`flex items-center gap-1 text-sm font-medium ${yearlyGrowth >= 0 ? 'text-running-green' : 'text-red-500'}`}>
            <TrendingUp size={16} />
            {isStravaConnected ? 'Données Strava' : `${yearlyGrowth >= 0 ? '+' : ''}${yearlyGrowth.toFixed(1)}% d'amélioration`}
          </div>
        </div>
      </div>

      {/* Dernière activité / Activité la plus longue */}
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-running-purple/10 p-2 rounded-lg">
            <TrendingUp className="text-running-purple" size={20} />
          </div>
          <h3 className="font-semibold text-gray-800">
            {isStravaConnected ? 'Dernière Activité' : 'Forme Actuelle'}
          </h3>
        </div>
        
        <div className="space-y-3">
          {isStravaConnected && stats?.latest ? (
            <>
              <div className="bg-gradient-performance text-white p-3 rounded-lg">
                <div className="text-sm opacity-90">{new Date(stats.latest.date).toLocaleDateString('fr-FR')}</div>
                <div className="text-xl font-bold">{stats.latest.distance} km</div>
                <div className="text-sm opacity-90 truncate">{stats.latest.name}</div>
              </div>
              
              {stats.monthly.longestActivity && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Plus longue ce mois</span>
                    <span className="font-medium text-running-purple">{stats.monthly.longestActivity.distance} km</span>
                  </div>
                  
                  <div className="text-xs text-gray-500 truncate">
                    {stats.monthly.longestActivity.name}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="bg-gradient-performance text-white p-3 rounded-lg">
                <div className="text-sm opacity-90">Allure moyenne 30j</div>
                <div className="text-xl font-bold">4:15/km</div>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Meilleure série</span>
                <span className="font-medium text-running-purple">7 jours consécutifs</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Prochains objectifs</span>
                <span className="font-medium text-running-orange">Sub-19' au 5km</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyStats;
