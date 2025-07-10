
import { useStravaData } from '@/hooks/useStravaData';
import { useMonthlyGoals } from '@/hooks/useMonthlyGoals';
import { monthlyStats } from '../data/mockData';
import StravaMonthlyDashboard from './StravaMonthlyDashboard';
import { MonthlyGoal } from './monthly-stats/MonthlyGoal';
import { YearlyTotal } from './monthly-stats/YearlyTotal';
import { LatestActivity } from './monthly-stats/LatestActivity';
import { MonthlyStatsLoading } from './monthly-stats/MonthlyStatsLoading';

const MonthlyStats = () => {
  const { stats, loading, isStravaConnected } = useStravaData();
  const { currentGoal, updateGoal } = useMonthlyGoals();

  // Utilise les données Strava si disponibles, sinon les données mockées
  const currentMonthKm = stats?.monthly.distance || monthlyStats.currentMonth.km;
  const yearlyTotal = stats?.yearly.distance || monthlyStats.yearTotal;
  const monthlyActivities = stats?.monthly.activitiesCount || 0;
  const yearlyActivities = stats?.yearly.activitiesCount || 0;

  // Calculs dynamiques
  const monthlyGrowth = ((currentMonthKm - monthlyStats.previousMonth.km) / monthlyStats.previousMonth.km * 100);
  const yearlyGrowth = ((yearlyTotal - monthlyStats.previousYear) / monthlyStats.previousYear * 100);

  if (loading) {
    return <MonthlyStatsLoading />;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Tableau de bord Strava en haut */}
      <StravaMonthlyDashboard />
      
      {/* Objectif mensuel */}
      <MonthlyGoal
        currentMonthKm={currentMonthKm}
        currentGoal={currentGoal}
        monthlyActivities={monthlyActivities}
        monthlyGrowth={monthlyGrowth}
        isStravaConnected={isStravaConnected}
        onUpdateGoal={updateGoal}
      />

      {/* Total annuel */}
      <YearlyTotal
        yearlyTotal={yearlyTotal}
        yearlyActivities={yearlyActivities}
        yearlyGrowth={yearlyGrowth}
        isStravaConnected={isStravaConnected}
      />

      {/* Dernière activité - Mobile optimisé */}
      {(isStravaConnected && stats?.latest) && (
        <LatestActivity latestActivity={stats.latest} />
      )}
    </div>
  );
};

export default MonthlyStats;
