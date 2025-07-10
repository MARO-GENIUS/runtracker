
import WeeklySummary from '../components/WeeklySummary';
import RecordsSlider from '../components/RecordsSlider';
import MonthlyStats from '../components/MonthlyStats';
import RunningCalendar from '../components/RunningCalendar';
import Layout from '../components/Layout';

const Dashboard = () => {
  return (
    <Layout>
      <div className="space-y-6 sm:space-y-8">
        <WeeklySummary />
        <RunningCalendar />
        <RecordsSlider />
        <MonthlyStats />
      </div>
    </Layout>
  );
};

export default Dashboard;
