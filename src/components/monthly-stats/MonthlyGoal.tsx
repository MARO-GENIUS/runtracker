
import { Target } from 'lucide-react';
import { getCurrentMonthName, getDaysRemainingInMonth, getDaysPassedInMonth, getDailyAverageNeeded, getProgressColor, getProgressBarColor } from '@/utils/dateHelpers';
import { GoalEditor } from './GoalEditor';

interface MonthlyGoalProps {
  currentMonthKm: number;
  currentGoal: number;
  monthlyActivities: number;
  monthlyGrowth: number;
  isStravaConnected: boolean;
  onUpdateGoal: (newGoal: number) => Promise<void>;
}

export const MonthlyGoal = ({ 
  currentMonthKm, 
  currentGoal, 
  monthlyActivities, 
  monthlyGrowth, 
  isStravaConnected, 
  onUpdateGoal 
}: MonthlyGoalProps) => {
  const progressPercentage = (currentMonthKm / currentGoal) * 100;
  const daysRemaining = getDaysRemainingInMonth();
  const daysPassed = getDaysPassedInMonth();
  const daysInMonth = daysPassed + daysRemaining;
  const daysPassedRatio = daysPassed / daysInMonth;
  const remainingKm = Math.max(0, currentGoal - currentMonthKm);
  const dailyAverageNeeded = getDailyAverageNeeded(remainingKm, daysRemaining);

  return (
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
        <GoalEditor currentGoal={currentGoal} onUpdateGoal={onUpdateGoal} />
      </div>
      
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
    </div>
  );
};
