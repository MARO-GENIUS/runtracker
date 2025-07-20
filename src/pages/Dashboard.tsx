
import WeeklySummary from '../components/WeeklySummary';
import RecordsSlider from '../components/RecordsSlider';
import MonthlyStats from '../components/MonthlyStats';
import RunningCalendar from '../components/RunningCalendar';
import Layout from '../components/Layout';

const Dashboard = () => {
  return (
    <Layout>
      <div className="space-y-6 sm:space-y-8">
        {/* Première ligne : Résumé hebdomadaire et Calendrier côte à côte sur tablette/desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          <WeeklySummary />
          <RunningCalendar />
        </div>
        
        {/* Sections suivantes conservent le layout pleine largeur */}
        <RecordsSlider />
        <MonthlyStats />
      </div>
    </Layout>
  );
};

export default Dashboard;
